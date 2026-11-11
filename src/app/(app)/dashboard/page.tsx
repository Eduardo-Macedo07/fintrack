import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { weeklyBudget } from "@/features/dashboard/budget";
import { CategoryBars } from "@/features/dashboard/components/category-bars";
import { cumulativeByDay } from "@/features/dashboard/cumulative";
import { MonthHero } from "@/features/dashboard/components/month-hero";
import { PaceChart } from "@/features/dashboard/components/pace-chart";
import { TransactionList } from "@/features/transactions/components/transaction-list";
import {
  getDailyFlow,
  getMonthSummary,
  listTransactions,
} from "@/features/transactions/server/service";
import { currentMonth, daysInMonth, isMonthKey, today } from "@/lib/dates";
import { PageSkeleton } from "@/components/layout/skeletons";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Início" };

async function DashboardContent({
  searchParams,
}: Pick<PageProps<"/dashboard">, "searchParams">) {
  // Cada página privada confirma a sessão: layouts não bastam como proteção.
  const user = await requireUser();

  const { month: raw } = await searchParams;
  const month = typeof raw === "string" && isMonthKey(raw) ? raw : currentMonth();

  const [summary, daily, transactions] = await Promise.all([
    getMonthSummary(prisma, user.id, month),
    getDailyFlow(prisma, user.id, month),
    listTransactions(prisma, user.id, { month }),
  ]);

  const todayDay = month === currentMonth() ? Number(today().slice(8, 10)) : null;

  const weekly =
    todayDay === null
      ? null
      : weeklyBudget({ net: summary.net, todayDay, daysInMonth: daysInMonth(month) });

  return (
    <div className="grid gap-12">
      <MonthHero
        month={month}
        income={summary.income}
        expense={summary.expense}
        balance={summary.balance}
        weekly={weekly}
      />

      <section aria-labelledby="categories-title">
        <h2
          id="categories-title"
          className="font-display mb-5 text-xl font-semibold tracking-tight"
        >
          Para onde foi o dinheiro
        </h2>
        <CategoryBars rows={summary.expensesByCategory} />
      </section>

      <section aria-labelledby="pace-title">
        <h2 id="pace-title" className="font-display text-xl font-semibold tracking-tight">
          Ritmo do mês
        </h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Quando a área vermelha passa da linha verde, você gastou mais do que entrou.
        </p>
        <PaceChart points={cumulativeByDay(month, daily)} todayDay={todayDay} />
      </section>

      <section aria-labelledby="recent-title">
        <div className="mb-3 flex items-baseline justify-between">
          <h2
            id="recent-title"
            className="font-display text-xl font-semibold tracking-tight"
          >
            Últimas transações
          </h2>
          {transactions.length > 5 && (
            <Link
              href={`/transactions?month=${month}`}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Ver todas
            </Link>
          )}
        </div>
        <TransactionList
          transactions={transactions.slice(0, 5)}
          emptyTitle="Nenhuma transação neste mês"
          emptyHint="Registre sua primeira despesa ou receita e o painel ganha vida."
        />
      </section>
    </div>
  );
}

/**
 * A página em si é síncrona: o conteúdo que lê sessão/banco fica num <Suspense> PRÓPRIO.
 * Um Suspense só no layout não basta: na navegação entre páginas o Next re-renderiza apenas
 * o que está abaixo do layout, então aquele fallback não apareceria.
 */
export default function Page(props: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent searchParams={props.searchParams} />
    </Suspense>
  );
}
