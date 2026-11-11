import type { TransactionType } from "@/generated/prisma/enums";

export type DefaultCategory = { name: string; type: TransactionType; color: string };

/** Categorias criadas para cada novo usuário. Depois são dele: pode editar ou excluir. */
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { name: "Alimentação", type: "EXPENSE", color: "#f97316" },
  { name: "Transporte", type: "EXPENSE", color: "#3b82f6" },
  { name: "Moradia", type: "EXPENSE", color: "#8b5cf6" },
  { name: "Lazer", type: "EXPENSE", color: "#ec4899" },
  { name: "Saúde", type: "EXPENSE", color: "#ef4444" },
  { name: "Educação", type: "EXPENSE", color: "#14b8a6" },
  { name: "Outras despesas", type: "EXPENSE", color: "#64748b" },
  { name: "Salário", type: "INCOME", color: "#22c55e" },
  { name: "Freelance", type: "INCOME", color: "#10b981" },
  { name: "Investimentos", type: "INCOME", color: "#06b6d4" },
  { name: "Outras receitas", type: "INCOME", color: "#84cc16" },
];
