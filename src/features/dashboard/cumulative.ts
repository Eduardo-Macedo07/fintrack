import { formatDay, monthRange } from "@/lib/dates";

export type DailyRow = { day: string; type: "INCOME" | "EXPENSE"; amount: number };

export type PacePoint = {
  /** Dia do mês (1..31). */
  day: number;
  /** Receitas acumuladas até o fim deste dia. */
  income: number;
  /** Despesas acumuladas até o fim deste dia. */
  expense: number;
};

/**
 * Transforma lançamentos por dia em séries ACUMULADAS, com um ponto por dia do mês.
 * Responde: "no dia X, quanto já entrou e quanto já saiu?".
 */
export function cumulativeByDay(month: string, rows: readonly DailyRow[]): PacePoint[] {
  const { start, end } = monthRange(month);
  const daysInMonth = Math.round((end.getTime() - start.getTime()) / 86_400_000);

  const perDay = new Map<number, { income: number; expense: number }>();
  for (const row of rows) {
    const day = Number(row.day.slice(8, 10));
    const bucket = perDay.get(day) ?? { income: 0, expense: 0 };
    if (row.type === "INCOME") bucket.income += row.amount;
    else bucket.expense += row.amount;
    perDay.set(day, bucket);
  }

  let income = 0;
  let expense = 0;
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const bucket = perDay.get(day);
    income += bucket?.income ?? 0;
    expense += bucket?.expense ?? 0;
    return { day, income, expense };
  });
}

export { formatDay };
