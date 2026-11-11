import { z } from "zod";

import { currentMonth, isMonthKey, parseDay } from "@/lib/dates";

/** R$ 10 milhões por transação: cabe com folga em Int32 (centavos) e evita erros de digitação absurdos. */
export const MAX_AMOUNT_CENTS = 1_000_000_000;

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const transactionInputSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"], { error: "Escolha receita ou despesa" }),
  // Chega do formulário como texto (centavos); `coerce` aceita número ou texto.
  amount: z.coerce
    .number({ error: "Informe um valor" })
    .int("Valor inválido")
    .min(1, "O valor deve ser maior que zero")
    .max(MAX_AMOUNT_CENTS, "Valor alto demais"),
  description: z
    .string()
    .trim()
    .min(1, "Informe uma descrição")
    .max(100, "A descrição deve ter no máximo 100 caracteres"),
  date: z
    .string()
    .refine(
      (v) => {
        try {
          parseDay(v);
          return true;
        } catch {
          return false;
        }
      },
      { error: "Data inválida" },
    )
    .transform(parseDay),
  categoryId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type TransactionInput = z.input<typeof transactionInputSchema>;
export type ParsedTransactionInput = z.output<typeof transactionInputSchema>;

export const transactionFiltersSchema = z.object({
  month: z.preprocess(
    (v) => (isMonthKey(v) ? v : undefined),
    z.string().default(() => currentMonth()),
  ),
  type: z.preprocess(emptyToUndefined, z.enum(["INCOME", "EXPENSE"]).optional()),
  categoryId: z.preprocess(emptyToUndefined, z.string().optional()),
  q: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
});

export type TransactionFilters = z.output<typeof transactionFiltersSchema>;
