import type { DailyRow } from "@/features/dashboard/cumulative";
import type { Cents } from "@/lib/money";

export type MonthlyAverages = {
  /** Quantos meses (com algum movimento) entraram na média. */
  months: number;
  income: Cents;
  expense: Cents;
  /** Média do que sobrou por mês (pode ser negativa). */
  net: Cents;
};

/**
 * Média mensal de receitas e despesas.
 * Só conta meses que têm movimento: quem começou a usar o app há 1 mês
 * não tem a média diluída por 2 meses vazios.
 */
export function monthlyAverages(rows: readonly DailyRow[]): MonthlyAverages {
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    const key = row.day.slice(0, 7);
    const bucket = byMonth.get(key) ?? { income: 0, expense: 0 };
    if (row.type === "INCOME") bucket.income += row.amount;
    else bucket.expense += row.amount;
    byMonth.set(key, bucket);
  }

  const months = byMonth.size;
  if (months === 0) return { months: 0, income: 0, expense: 0, net: 0 };

  let income = 0;
  let expense = 0;
  for (const b of byMonth.values()) {
    income += b.income;
    expense += b.expense;
  }
  return {
    months,
    income: Math.round(income / months),
    expense: Math.round(expense / months),
    net: Math.round((income - expense) / months),
  };
}
