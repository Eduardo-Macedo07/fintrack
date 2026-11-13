/**
 * Substitui `features/transactions/server/actions.ts` na demonstração: mesmas assinaturas,
 * validação e mensagens. O dono continua vindo da sessão, nunca do formulário.
 */
import { z } from "zod";

import { transactionInputSchema } from "@/features/transactions/schemas";
import type { SaveState } from "@/features/transactions/server/actions";
import {
  InvalidCategoryError,
  NotFoundError,
} from "@/features/transactions/server/service";

import { createTransaction, deleteTransaction, updateTransaction } from "./data";
import { commit, currentUser, getState, newId } from "./store";

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const NO_SESSION: SaveState = { error: "Sua sessão terminou. Entre de novo." };

export async function saveTransactionAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const user = currentUser();
  if (!user) return NO_SESSION;

  const raw = {
    type: text(formData, "type"),
    amount: text(formData, "amount"),
    description: text(formData, "description"),
    date: text(formData, "date"),
    categoryId: text(formData, "categoryId"),
  };
  const id = text(formData, "id");

  const parsed = transactionInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    const result = id
      ? updateTransaction(getState(), user.id, id, raw)
      : createTransaction(getState(), user.id, raw, newId);
    commit(result.state);
  } catch (error) {
    if (error instanceof InvalidCategoryError) {
      return { fieldErrors: { categoryId: [error.message] } };
    }
    if (error instanceof NotFoundError) {
      return { error: "Esta transação não existe mais. Feche e atualize a lista." };
    }
    throw error;
  }

  const kind = raw.type === "INCOME" ? "Receita" : "Despesa";
  return { ok: true, message: id ? `${kind} atualizada` : `${kind} salva` };
}

export async function deleteTransactionAction(id: string): Promise<SaveState> {
  const user = currentUser();
  if (!user) return NO_SESSION;
  try {
    commit(deleteTransaction(getState(), user.id, id));
  } catch (error) {
    if (error instanceof NotFoundError)
      return { error: "Esta transação não existe mais." };
    throw error;
  }
  return { ok: true, message: "Transação excluída" };
}
