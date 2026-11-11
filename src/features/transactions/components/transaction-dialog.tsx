"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useMemo,
  useState,
} from "react";

import { Segmented } from "@/components/segmented";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseDay, formatDay, today } from "@/lib/dates";
import { cn } from "@/lib/utils";

import {
  deleteTransactionAction,
  saveTransactionAction,
  type SaveState,
} from "../server/actions";
import type { TransactionDTO } from "../server/service";
import { AmountInput } from "./amount-input";

export type CategoryOption = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
};

type Editing = TransactionDTO | null;
type Api = {
  openNew: (type?: "INCOME" | "EXPENSE") => void;
  openEdit: (t: TransactionDTO) => void;
};

const TransactionUIContext = createContext<Api>({
  openNew: () => {},
  openEdit: () => {},
});
export const useTransactionDialog = () => useContext(TransactionUIContext);

/** Mantém um único diálogo de transação para o app inteiro (botão "+" e linhas da lista abrem o mesmo). */
export function TransactionDialogProvider({
  categories,
  children,
}: {
  categories: CategoryOption[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [initialType, setInitialType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  // Muda a cada abertura: o formulário nasce limpo (ou preenchido) em vez de herdar o estado anterior.
  const [session, setSession] = useState(0);

  const api = useMemo<Api>(
    () => ({
      openNew: (type = "EXPENSE") => {
        setEditing(null);
        setInitialType(type);
        setSession((s) => s + 1);
        setOpen(true);
      },
      openEdit: (t) => {
        setEditing(t);
        setInitialType(t.type);
        setSession((s) => s + 1);
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <TransactionUIContext.Provider value={api}>
      {children}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar transação" : "Nova transação"}
      >
        <TransactionForm
          key={session}
          editing={editing}
          initialType={initialType}
          categories={categories}
          onDone={() => setOpen(false)}
        />
      </Dialog>
    </TransactionUIContext.Provider>
  );
}

function TransactionForm({
  editing,
  initialType,
  categories,
  onDone,
}: {
  editing: Editing;
  initialType: "INCOME" | "EXPENSE";
  categories: CategoryOption[];
  onDone: () => void;
}) {
  const toast = useToast();
  const [type, setType] = useState<"INCOME" | "EXPENSE">(initialType);
  const [cents, setCents] = useState(editing?.amount ?? 0);
  const [categoryId, setCategoryId] = useState(editing?.category?.id ?? "");
  const [date, setDate] = useState(editing?.date ?? today());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const [state, action, pending] = useActionState<SaveState, FormData>(
    async (prev, formData) => {
      const result = await saveTransactionAction(prev, formData);
      if (result?.ok) {
        toast(result.message ?? "Salvo");
        onDone();
      }
      return result;
    },
    undefined,
  );

  const options = categories.filter((c) => c.type === type);
  const errors = state?.fieldErrors ?? {};
  const yesterday = formatDay(new Date(parseDay(today()).getTime() - 86_400_000));

  function changeType(next: "INCOME" | "EXPENSE") {
    setType(next);
    // Categoria de despesa não vale para receita (e vice-versa).
    if (!categories.some((c) => c.id === categoryId && c.type === next))
      setCategoryId("");
  }

  function remove() {
    if (!editing) return;
    setDeleting(true);
    startTransition(async () => {
      const result = await deleteTransactionAction(editing.id);
      if (result?.ok) {
        toast(result.message ?? "Excluída");
        onDone();
      } else {
        setDeleteError(result?.error ?? "Não foi possível excluir. Tente de novo.");
        setDeleting(false);
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <form action={action} className="grid gap-5" noValidate>
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="categoryId" value={categoryId} />

      <Segmented
        label="Tipo de transação"
        value={type}
        onChange={changeType}
        className="w-full"
        options={[
          {
            value: "EXPENSE",
            label: "Despesa",
            activeClassName: "bg-foreground",
            activeTextClassName: "text-background",
          },
          {
            value: "INCOME",
            label: "Receita",
            activeClassName: "bg-income",
            activeTextClassName: "text-income-foreground",
          },
        ]}
      />

      <AmountInput
        name="amount"
        cents={cents}
        onChange={setCents}
        tone={type === "INCOME" ? "income" : "expense"}
        error={errors.amount?.[0]}
      />

      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          name="description"
          defaultValue={editing?.description}
          placeholder={type === "INCOME" ? "Ex.: Salário" : "Ex.: Mercado"}
          autoComplete="off"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description && (
          <p id="description-error" role="alert" className="text-sm text-destructive">
            {errors.description[0]}
          </p>
        )}
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-0.5 text-sm font-medium">Categoria</legend>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {options.map((c) => {
              const active = c.id === categoryId;
              return (
                <motion.button
                  key={c.id}
                  layout
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategoryId(active ? "" : c.id)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    active
                      ? "border-transparent text-white"
                      : "border-border hover:bg-muted",
                  )}
                  style={active ? { backgroundColor: c.color } : undefined}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: active ? "#fff" : c.color }}
                  />
                  {c.name}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
        {errors.categoryId && (
          <p role="alert" className="text-sm text-destructive">
            {errors.categoryId[0]}
          </p>
        )}
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="date">Data</Label>
        <div className="flex items-center gap-2">
          <Input
            id="date"
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-w-0 flex-1"
            aria-invalid={errors.date ? true : undefined}
          />
          {[
            { label: "Hoje", value: today() },
            { label: "Ontem", value: yesterday },
          ].map((quick) => (
            <button
              key={quick.label}
              type="button"
              onClick={() => setDate(quick.value)}
              className={cn(
                "h-9 rounded-md px-3 text-sm font-medium transition-colors",
                date === quick.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-border",
              )}
            >
              {quick.label}
            </button>
          ))}
        </div>
        {errors.date && (
          <p role="alert" className="text-sm text-destructive">
            {errors.date[0]}
          </p>
        )}
      </div>

      {(state?.error || deleteError) && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state?.error ?? deleteError}
        </p>
      )}

      <div className="flex items-center gap-3">
        {editing &&
          (confirmingDelete ? (
            <Button
              type="button"
              variant="destructive"
              onClick={remove}
              disabled={deleting}
              className="shrink-0"
            >
              {deleting ? "Excluindo…" : "Confirmar exclusão"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmingDelete(true)}
              className="shrink-0 text-destructive"
            >
              Excluir
            </Button>
          ))}
        <Button type="submit" size="lg" className="flex-1" disabled={pending || deleting}>
          {pending ? "Salvando…" : editing ? "Salvar alterações" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
