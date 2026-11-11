/**
 * Dinheiro no FinTrack é SEMPRE um inteiro em centavos (ex.: R$ 12,34 → 1234).
 * Nunca usamos `number` com casas decimais para valores monetários: 0.1 + 0.2 !== 0.3.
 */
export type Cents = number;

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Converte reais (número ou texto como "1.234,56") em centavos inteiros. */
export function toCents(value: number | string): Cents {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new RangeError("Valor monetário inválido");
    return Math.round(value * 100);
  }
  const normalized = value
    .trim()
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new RangeError(`Valor monetário inválido: "${value}"`);
  }
  return Math.round(Number(normalized) * 100);
}

/** Formata centavos como moeda brasileira: 123456 → "R$ 1.234,56". */
export function formatBRL(cents: Cents): string {
  return BRL.format(cents / 100);
}

/**
 * Divide um total em `parts` parcelas sem perder centavos.
 * O resto é distribuído nas primeiras parcelas: 1000 / 3 → [334, 333, 333].
 */
export function splitInstallments(total: Cents, parts: number): Cents[] {
  if (!Number.isInteger(parts) || parts < 1) {
    throw new RangeError("O número de parcelas deve ser um inteiro >= 1");
  }
  const base = Math.floor(total / parts);
  const remainder = total - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}
