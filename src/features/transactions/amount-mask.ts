import { toCents } from "@/lib/money";

import { MAX_AMOUNT_CENTS } from "./schemas";

const onlyDigits = (text: string) => text.replace(/\D/g, "");

/** O texto que o campo mostra: 3590 → "35,90"; 123456 → "1.234,56". */
export function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Regra do campo de valor "caixa registradora", INDEPENDENTE de onde está o cursor.
 *
 * No celular, tocar no campo põe o cursor no meio de "0,00". Se só extraíssemos os dígitos
 * do texto novo, o primeiro número entraria no meio e o valor sairia errado
 * (digitar 3590 virava 3.005,90). Por isso comparamos o texto novo com o que estava na tela:
 *
 *  - é o texto da tela com 1 caractere A MAIS → foi digitado: se for dígito, vai para o FIM
 *    do valor (35,90 + 7 → 359,07), em qualquer posição do cursor; se não for, é ignorado
 *  - é o texto da tela com 1 caractere A MENOS → foi apagado: remove o último dígito, mesmo
 *    que o caractere apagado seja a vírgula ou o ponto (cursor no meio do número)
 *  - qualquer outra coisa (selecionar tudo e digitar, preenchimento automático) → vale o texto todo
 *
 * Colar NÃO passa por aqui (ver `parsePasted`).
 */
export function nextCents(previousCents: number, newText: string): number {
  const shown = formatAmount(previousCents);
  const typed = insertedChar(shown, newText);

  let value: number;
  if (typed !== null) {
    value = /\d/.test(typed) ? previousCents * 10 + Number(typed) : previousCents;
  } else if (insertedChar(newText, shown) !== null) {
    value = Math.floor(previousCents / 10);
  } else {
    value = Number(onlyDigits(newText) || 0);
  }
  return Math.min(value, MAX_AMOUNT_CENTS);
}

/** Se `longer` é exatamente `shorter` com um caractere inserido, devolve esse caractere. */
function insertedChar(shorter: string, longer: string): string | null {
  if (longer.length !== shorter.length + 1) return null;
  let i = 0;
  while (i < shorter.length && shorter[i] === longer[i]) i++;
  return shorter === longer.slice(0, i) + longer.slice(i + 1) ? longer[i] : null;
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
