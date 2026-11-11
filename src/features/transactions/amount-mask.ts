import { toCents } from "@/lib/money";

import { MAX_AMOUNT_CENTS } from "./schemas";

const onlyDigits = (text: string) => text.replace(/\D/g, "");

/** Os dígitos que o campo MOSTRA para um valor: sempre ao menos 3 ("0,00" → "000"). */
export const displayDigits = (cents: number) => String(cents).padStart(3, "0");

/**
 * Regra do campo de valor "caixa registradora", INDEPENDENTE de onde está o cursor.
 *
 * No celular, tocar no campo põe o cursor no meio de "0,00". Se só extraíssemos os dígitos
 * do texto novo, o primeiro número entraria no meio e o valor sairia errado
 * (digitar 3590 virava 3.005,90). Por isso comparamos com os dígitos que estavam na tela:
 *
 *  - entrou 1 dígito, em qualquer posição → ele vai para o FIM do valor (35,90 + 7 → 359,07)
 *  - saiu 1 dígito, em qualquer posição   → remove o último (359,07 → 35,90)
 *  - qualquer outra mudança (selecionar tudo e digitar, preenchimento automático) → usa o texto todo
 *
 * Colar NÃO passa por aqui (ver `parsePasted`): por tamanho, colar "12,34" num campo zerado é
 * indistinguível de digitar um número.
 */
export function nextCents(previousCents: number, newText: string): number {
  const before = displayDigits(previousCents);
  const after = onlyDigits(newText);

  let value: number;
  if (after.length === before.length + 1) {
    value = previousCents * 10 + Number(insertedDigit(before, after));
  } else if (after.length === before.length - 1) {
    value = Math.floor(previousCents / 10);
  } else {
    value = Number(after || 0);
  }
  return Math.min(value, MAX_AMOUNT_CENTS);
}

/** Qual dígito foi digitado: o do primeiro ponto em que os textos divergem (ou o último). */
function insertedDigit(before: string, after: string): string {
  for (let i = 0; i < before.length; i++) {
    if (before[i] !== after[i]) return after[i];
  }
  return after[after.length - 1];
}

/**
 * Interpreta um texto COLADO como valor em reais: "R$ 12,34" → 1234, "1.234,56" → 123456,
 * "12" → 1200 (R$ 12,00). Devolve `null` se não for um valor válido (a colagem é ignorada).
 */
export function parsePasted(text: string): number | null {
  try {
    const cents = toCents(text);
    return cents >= 0 ? Math.min(cents, MAX_AMOUNT_CENTS) : null;
  } catch {
    return null;
  }
}
