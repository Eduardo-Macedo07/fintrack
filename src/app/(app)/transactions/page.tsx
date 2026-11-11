import type { Metadata } from "next";

import { MonthSwitcher } from "@/components/month-switcher";
import { TransactionFilters } from "@/features/transactions/components/transaction-filters";
import { TransactionList } from "@/features/transactions/components/transaction-list";
import { listCategories, listTransactions } from "@/features/transactions/server/service";
import { transactionFiltersSchema } from "@/features/transactions/schemas";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Transações" };

export default async function TransactionsPage({
  searchParams,
}: PageProps<"/transactions">) {
  const user = await requireUser();

  const raw = await searchParams;
  const pick = (key: string) => (typeof raw[key] === "string" ? raw[key] : undefined);
  const filters = transactionFiltersSchema.parse({
    month: pick("month"),
    type: pick("type"),
    categoryId: pick("categoryId"),
    q: pick("q"),
  });

  const [transactions, categories] = await Promise.all([
    listTransactions(prisma, user.id, filters),
    listCategories(prisma, user.id),
  ]);

  const filtered = Boolean(filters.type || filters.categoryId || filters.q);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Transações</h1>
        <MonthSwitcher month={filters.month} />
      </div>

      <TransactionFilters categories={categories} />

      <TransactionList
        transactions={transactions}
        emptyTitle={filtered ? "Nada encontrado" : "Nenhuma transação neste mês"}
        emptyHint={
          filtered
            ? "Tente outra busca ou limpe os filtros."
            : "Registre uma despesa ou receita para começar."
        }
      />
    </div>
  );
}
