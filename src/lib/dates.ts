/**
 * Datas de transação são DATAS DE CALENDÁRIO (dia/mês/ano), não instantes.
 * Guardamos sempre à meia-noite UTC: "31/10" nunca vira "01/11" por causa de fuso.
 * O fuso só importa para descobrir "que dia/mês é hoje" para o usuário.
 */
export const APP_TIMEZONE = "America/Sao_Paulo";

/** Mês no formato "YYYY-MM". */
export type MonthKey = string;

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && MONTH_RE.test(value);
}

/** "2026-11-05" → Date (2026-11-05T00:00:00Z). Lança erro para datas inexistentes (ex.: 31/02). */
export function parseDay(value: string): Date {
  const m = DAY_RE.exec(value);
  if (!m) throw new RangeError(`Data inválida: "${value}"`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d
  ) {
    throw new RangeError(`Data inválida: "${value}"`);
  }
  return date;
}

export function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Hoje (dia de calendário) no fuso do app, como "YYYY-MM-DD". */
export function today(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function currentMonth(now: Date = new Date()): MonthKey {
  return today(now).slice(0, 7);
}

/** Início (inclusivo) e fim (exclusivo) do mês, em UTC. */
export function monthRange(month: MonthKey): { start: Date; end: Date } {
  const m = MONTH_RE.exec(month);
  if (!m) throw new RangeError(`Mês inválido: "${month}"`);
  const [y, mo] = [Number(m[1]), Number(m[2])];
  return { start: new Date(Date.UTC(y, mo - 1, 1)), end: new Date(Date.UTC(y, mo, 1)) };
}

/** Quantos dias tem o mês (28 a 31). */
export function daysInMonth(month: MonthKey): number {
  const { start, end } = monthRange(month);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const { start } = monthRange(month);
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** "2026-11" → "novembro de 2026". */
export function formatMonthLabel(month: MonthKey): string {
  const { start } = monthRange(month);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(start);
}

/** Rótulo de dia para agrupar listas: "Hoje", "Ontem" ou "qua., 5 de nov.". */
export function formatDayLabel(day: string, now: Date = new Date()): string {
  const t = parseDay(today(now));
  const diff = Math.round((t.getTime() - parseDay(day).getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(parseDay(day));
}
