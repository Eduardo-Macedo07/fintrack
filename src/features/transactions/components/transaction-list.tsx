"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDayLabel } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { softSpring } from "@/lib/motion";

import type { TransactionDTO } from "../server/service";
import { useTransactionDialog } from "./transaction-dialog";

function groupByDay(transactions: TransactionDTO[]) {
  const groups = new Map<string, TransactionDTO[]>();
  for (const t of transactions) groups.set(t.date, [...(groups.get(t.date) ?? []), t]);
  return [...groups.entries()];
}

export function TransactionList({
  transactions,
  emptyTitle = "Nenhuma transação neste período",
  emptyHint = "Registre uma despesa ou receita para começar.",
}: {
  transactions: TransactionDTO[];
  emptyTitle?: string;
  emptyHint?: string;
}) {
  const { openNew } = useTransactionDialog();

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <p className="font-display text-xl font-semibold">{emptyTitle}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{emptyHint}</p>
        <Button onClick={() => openNew()} className="mt-2">
          <Plus /> Nova transação
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AnimatePresence initial={false}>
        {groupByDay(transactions).map(([day, items]) => {
          const net = items.reduce(
            (sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount),
            0,
          );
          return (
            <motion.section
              key={day}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={softSpring}
              aria-label={formatDayLabel(day)}
            >
              <div className="mb-1 flex items-baseline justify-between px-1">
                <h3 className="text-sm font-medium text-muted-foreground capitalize">
                  {formatDayLabel(day)}
                </h3>
                <span className="tabular text-sm text-muted-foreground">
                  {net > 0 ? "+" : net < 0 ? "−" : ""}
                  {formatBRL(Math.abs(net))}
                </span>
              </div>
              <ul>
                <AnimatePresence initial={false}>
                  {items.map((t) => (
                    <TransactionRow key={t.id} t={t} />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function TransactionRow({ t }: { t: TransactionDTO }) {
  const { openEdit } = useTransactionDialog();
  const color = t.category?.color ?? "#94a3b8";
  const income = t.type === "INCOME";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
      transition={softSpring}
      className="overflow-hidden"
    >
      <button
        type="button"
        onClick={() => openEdit(t)}
        className="flex w-full items-center gap-3 rounded-2xl px-1 py-2.5 text-left transition-colors outline-none hover:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:px-2"
      >
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {(t.category?.name ?? t.description).charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{t.description}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {t.category?.name ?? "Sem categoria"}
          </span>
        </span>
        <span className={`tabular shrink-0 font-medium ${income ? "text-income" : ""}`}>
          {income ? "+" : "−"}
          {formatBRL(t.amount)}
        </span>
      </button>
    </motion.li>
  );
}
