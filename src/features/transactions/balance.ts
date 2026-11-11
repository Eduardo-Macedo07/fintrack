import type { Cents } from "@/lib/money";

export type TypeSum = {
  type: "INCOME" | "EXPENSE";
  _sum: { amount: number | null };
};

export type Totals = { income: Cents; expense: Cents };

/** Converte o resultado agrupado do banco em totais de receita e despesa. */
export function totalsByType(rows: readonly TypeSum[]): Totals {
  const totals: Totals = { income: 0, expense: 0 };
  for (const row of rows) {
    const amount = row._sum.amount ?? 0;
    if (row.type === "INCOME") totals.income += amount;
    else totals.expense += amount;
  }
  return totals;
}

/** Saldo = saldo inicial das contas + tudo que entrou − tudo que saiu. */
export function balanceOf(initialBalance: Cents, totals: Totals): Cents {
  return initialBalance + totals.income - totals.expense;
}
