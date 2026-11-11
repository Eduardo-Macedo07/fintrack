"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";

import { transactionInputSchema } from "../schemas";
import {
  createTransaction,
  deleteTransaction,
  InvalidCategoryError,
  NotFoundError,
  updateTransaction,
} from "./service";

export type SaveState =
  | {
      ok?: boolean;
      message?: string;
      error?: string;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | undefined;

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

/** Cria (sem `id`) ou edita (com `id`) uma transação do usuário logado. */
export async function saveTransactionAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const user = await requireUser(); // o dono vem da sessão, nunca do formulário

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
    if (id) await updateTransaction(prisma, user.id, id, raw);
    else await createTransaction(prisma, user.id, raw);
  } catch (error) {
    if (error instanceof InvalidCategoryError) {
      return { fieldErrors: { categoryId: [error.message] } };
    }
    if (error instanceof NotFoundError) {
      return { error: "Esta transação não existe mais. Feche e atualize a lista." };
    }
    throw error;
  }

  refresh();
  const kind = raw.type === "INCOME" ? "Receita" : "Despesa";
  return { ok: true, message: id ? `${kind} atualizada` : `${kind} salva` };
}

export async function deleteTransactionAction(id: string): Promise<SaveState> {
  const user = await requireUser();
  try {
    await deleteTransaction(prisma, user.id, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { error: "Esta transação não existe mais." };
    }
    throw error;
  }
  refresh();
  return { ok: true, message: "Transação excluída" };
}
