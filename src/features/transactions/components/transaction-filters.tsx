"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

import { Segmented } from "@/components/segmented";

import type { CategoryOption } from "./transaction-dialog";

type TypeFilter = "ALL" | "INCOME" | "EXPENSE";

/** Filtros guardados na URL: dá para recarregar, voltar e compartilhar o link sem perder a busca. */
export function TransactionFilters({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const type = (params.get("type") as TypeFilter | null) ?? "ALL";
  const categoryId = params.get("categoryId") ?? "";
  const visibleCategories =
    type === "ALL" ? categories : categories.filter((c) => c.type === type);

  function update(patch: Record<string, string | undefined>) {
    // Lê a URL de AGORA (não a capturada na renderização): a busca é atrasada em 300 ms
    // e, nesse intervalo, o usuário pode ter trocado outro filtro.
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() =>
      router.replace(`${pathname}?${next.toString()}`, { scroll: false }),
    );
  }

  return (
    <div className={`grid gap-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <Segmented<TypeFilter>
        label="Filtrar por tipo"
        value={type}
        onChange={(value) =>
          update({ type: value === "ALL" ? undefined : value, categoryId: undefined })
        }
        className="w-full sm:w-auto"
        options={[
          { value: "ALL", label: "Tudo" },
          {
            value: "EXPENSE",
            label: "Despesas",
            activeClassName: "bg-foreground",
            activeTextClassName: "text-background",
          },
          {
            value: "INCOME",
            label: "Receitas",
            activeClassName: "bg-income",
            activeTextClassName: "text-income-foreground",
          },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="relative">
          <span className="sr-only">Buscar pela descrição</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            defaultValue={params.get("q") ?? ""}
            placeholder="Buscar pela descrição"
            onChange={(e) => {
              const value = e.target.value;
              clearTimeout(timer.current);
              timer.current = setTimeout(
                () => update({ q: value.trim() || undefined }),
                300,
              );
            }}
            className="h-10 w-full rounded-xl border bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
        </label>
        <label>
          <span className="sr-only">Filtrar por categoria</span>
          <select
            value={categoryId}
            onChange={(e) => update({ categoryId: e.target.value || undefined })}
            className="h-10 w-full rounded-xl border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <option value="">Todas as categorias</option>
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
