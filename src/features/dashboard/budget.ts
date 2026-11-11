import type { Cents } from "@/lib/money";

export type WeeklyBudget = {
  /** Quanto dá para gastar por semana até o fim do mês. */
  perWeek: Cents;
  perDay: Cents;
  /** Dias que faltam, contando hoje. */
  daysLeft: number;
  /** Já gastou mais do que entrou: não sobra nada. */
  over: boolean;
};

/**
 * Divide o que sobra do mês (entrou − saiu até agora) pelos dias restantes.
 *
 * - Conta o dia de hoje (no dia 30 de um mês de 30 dias, falta 1 dia).
 * - A semana nunca passa do que sobra: com 3 dias restantes e R$ 300, a "semana" é R$ 300, não R$ 700.
 * - Sem sobra, tudo é zero e `over` é verdadeiro.
 */
export function weeklyBudget({
  net,
  todayDay,
  daysInMonth,
}: {
  net: Cents;
  todayDay: number;
  daysInMonth: number;
}): WeeklyBudget {
  const daysLeft = Math.max(1, daysInMonth - todayDay + 1);
  if (net <= 0) return { perWeek: 0, perDay: 0, daysLeft, over: true };

  return {
    perDay: Math.floor(net / daysLeft),
    perWeek: Math.min(net, Math.floor((net * 7) / daysLeft)),
    daysLeft,
    over: false,
  };
}
