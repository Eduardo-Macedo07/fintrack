import type { Cents } from "@/lib/money";

export type ProjectionPoint = { month: number; contributed: Cents; total: Cents };

export type Projection = {
  points: ProjectionPoint[];
  /** Valor acumulado ao fim do período. */
  total: Cents;
  /** Quanto saiu do seu bolso (aporte inicial + mensalidades). */
  contributed: Cents;
  /** Quanto veio de rendimento. */
  interest: Cents;
};

type Params = {
  initial?: Cents;
  monthly: Cents;
  /** Rendimento anual em %, ex.: 11 para 11% ao ano. */
  annualRatePct: number;
};

function monthlyRate(annualRatePct: number): number {
  if (!Number.isFinite(annualRatePct) || annualRatePct < 0 || annualRatePct > 100) {
    throw new RangeError("A taxa anual deve estar entre 0% e 100%");
  }
  // Taxa mensal EQUIVALENTE à anual (juros compostos), não anual ÷ 12.
  return Math.pow(1 + annualRatePct / 100, 1 / 12) - 1;
}

/**
 * Projeta o acúmulo com aporte no fim de cada mês e juros compostos.
 * Valores nominais (sem descontar inflação nem imposto).
 */
export function projectSavings({
  initial = 0,
  monthly,
  annualRatePct,
  months,
}: Params & { months: number }): Projection {
  if (!Number.isInteger(months) || months < 0 || months > 600) {
    throw new RangeError("O período deve ser de 0 a 600 meses");
  }
  if (monthly < 0 || initial < 0) throw new RangeError("Valores não podem ser negativos");

  const r = monthlyRate(annualRatePct);
  let balance = initial;
  const points: ProjectionPoint[] = [{ month: 0, contributed: initial, total: initial }];

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + r) + monthly;
    points.push({
      month: m,
      contributed: initial + monthly * m,
      total: Math.round(balance),
    });
  }

  const last = points[points.length - 1];
  return {
    points,
    total: last.total,
    contributed: last.contributed,
    interest: last.total - last.contributed,
  };
}

/** Em quantos meses o acumulado alcança a meta. `null` se nunca (ou passa do limite). */
export function monthsToTarget({
  target,
  initial = 0,
  monthly,
  annualRatePct,
  maxMonths = 600,
}: Params & { target: Cents; maxMonths?: number }): number | null {
  if (target <= initial) return 0;
  if (monthly <= 0 && annualRatePct <= 0) return null;

  const r = monthlyRate(annualRatePct);
  let balance = initial;
  for (let m = 1; m <= maxMonths; m++) {
    balance = balance * (1 + r) + monthly;
    if (Math.round(balance) >= target) return m;
  }
  return null;
}

/** Quanto um valor futuro compra em dinheiro de hoje, dada a inflação anual. */
export function inTodaysMoney(cents: Cents, inflationPct: number, months: number): Cents {
  return Math.round(cents / Math.pow(1 + inflationPct / 100, months / 12));
}

/** 15 → "1 ano e 3 meses"; 8 → "8 meses"; 24 → "2 anos". */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = years === 1 ? "1 ano" : `${years} anos`;
  const m = rest === 1 ? "1 mês" : `${rest} meses`;
  if (years === 0) return m;
  return rest === 0 ? y : `${y} e ${m}`;
}
