import { formatDay, monthRange, shiftMonth } from "@/lib/dates";
import type { Prisma } from "@/generated/prisma/client";
import type { Db } from "@/server/db";

import type { DailyRow } from "@/features/dashboard/cumulative";
import { monthlyAverages, type MonthlyAverages } from "@/features/planning/averages";

import { balanceOf, totalsByType } from "../balance";
import {
  transactionFiltersSchema,
  transactionInputSchema,
  type TransactionFilters,
} from "../schemas";

/** Não existe OU pertence a outro usuário. Nunca diferenciamos os dois casos. */
export class NotFoundError extends Error {
  constructor(what = "Registro") {
    super(`${what} não encontrado`);
    this.name = "NotFoundError";
  }
}

export class InvalidCategoryError extends Error {
  constructor(message = "Categoria inválida") {
    super(message);
    this.name = "InvalidCategoryError";
  }
}

export type TransactionDTO = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  category: { id: string; name: string; color: string } | null;
};

const transactionSelect = {
  id: true,
  type: true,
  amount: true,
  description: true,
  date: true,
  category: { select: { id: true, name: true, color: true } },
} satisfies Prisma.TransactionSelect;

function toDTO(
  row: Prisma.TransactionGetPayload<{ select: typeof transactionSelect }>,
): TransactionDTO {
  return { ...row, date: formatDay(row.date) };
}

/** A categoria precisa ser DESTE usuário e do mesmo tipo da transação. */
async function resolveCategoryId(
  db: Db,
  userId: string,
  categoryId: string | undefined,
  type: "INCOME" | "EXPENSE",
): Promise<string | null> {
  if (!categoryId) return null;
  const category = await db.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true, type: true },
  });
  if (!category) throw new InvalidCategoryError();
  if (category.type !== type) {
    throw new InvalidCategoryError("A categoria não combina com o tipo da transação");
  }
  return category.id;
}

/** O app esconde as contas: toda transação cai na primeira conta ativa do usuário. */
async function defaultAccountId(db: Db, userId: string): Promise<string> {
  const account = await db.account.findFirst({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!account) throw new Error("Usuário sem conta ativa");
  return account.id;
}

export async function createTransaction(db: Db, userId: string, input: unknown) {
  const data = transactionInputSchema.parse(input);
  const [categoryId, accountId] = await Promise.all([
    resolveCategoryId(db, userId, data.categoryId, data.type),
    defaultAccountId(db, userId),
  ]);

  const row = await db.transaction.create({
    data: {
      userId,
      accountId,
      categoryId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date,
    },
    select: transactionSelect,
  });
  return toDTO(row);
}

export async function updateTransaction(
  db: Db,
  userId: string,
  id: string,
  input: unknown,
) {
  const data = transactionInputSchema.parse(input);
  const categoryId = await resolveCategoryId(db, userId, data.categoryId, data.type);

  // `updateMany` com userId no filtro: atualiza só se for do usuário, sem vazar existência.
  const { count } = await db.transaction.updateMany({
    where: { id, userId },
    data: {
      categoryId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date,
    },
  });
  if (count === 0) throw new NotFoundError("Transação");

  const row = await db.transaction.findFirstOrThrow({
    where: { id, userId },
    select: transactionSelect,
  });
  return toDTO(row);
}

export async function deleteTransaction(db: Db, userId: string, id: string) {
  const { count } = await db.transaction.deleteMany({ where: { id, userId } });
  if (count === 0) throw new NotFoundError("Transação");
}

export async function listTransactions(
  db: Db,
  userId: string,
  rawFilters: unknown = {},
): Promise<TransactionDTO[]> {
  const filters = transactionFiltersSchema.parse(rawFilters ?? {});
  const { start, end } = monthRange(filters.month);

  const rows = await db.transaction.findMany({
    where: {
      userId,
      date: { gte: start, lt: end },
      ...(filters.type && { type: filters.type }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.q && { description: { contains: filters.q, mode: "insensitive" } }),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 500,
    select: transactionSelect,
  });
  return rows.map(toDTO);
}

export async function listCategories(db: Db, userId: string) {
  return db.category.findMany({
    where: { userId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: { id: true, name: true, type: true, color: true },
  });
}

export type MonthSummary = {
  month: string;
  income: number;
  expense: number;
  /** Receitas − despesas só deste mês. */
  net: number;
  /** Saldo acumulado até o fim do mês (inclui saldo inicial e meses anteriores). */
  balance: number;
  expensesByCategory: {
    categoryId: string | null;
    name: string;
    color: string;
    amount: number;
  }[];
};

export async function getMonthSummary(
  db: Db,
  userId: string,
  month: TransactionFilters["month"],
): Promise<MonthSummary> {
  const { start, end } = monthRange(month);

  const [monthly, accumulated, initial, byCategory] = await Promise.all([
    db.transaction.groupBy({
      by: ["type"],
      where: { userId, date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["type"],
      where: { userId, date: { lt: end } },
      _sum: { amount: true },
    }),
    db.account.aggregate({ where: { userId }, _sum: { initialBalance: true } }),
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const categoryIds = byCategory.flatMap((r) => (r.categoryId ? [r.categoryId] : []));
  const categories = await db.category.findMany({
    where: { userId, id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });
  const byId = new Map(categories.map((c) => [c.id, c]));

  const totals = totalsByType(monthly);
  return {
    month,
    income: totals.income,
    expense: totals.expense,
    net: totals.income - totals.expense,
    balance: balanceOf(initial._sum.initialBalance ?? 0, totalsByType(accumulated)),
    expensesByCategory: byCategory
      .map((r) => {
        const c = r.categoryId ? byId.get(r.categoryId) : undefined;
        return {
          categoryId: r.categoryId,
          name: c?.name ?? "Sem categoria",
          color: c?.color ?? "#94a3b8",
          amount: r._sum.amount ?? 0,
        };
      })
      .sort((a, b) => b.amount - a.amount),
  };
}

/** Movimentação diária num intervalo [start, end) (base dos gráficos e das médias). */
async function dailyFlowBetween(
  db: Db,
  userId: string,
  start: Date,
  end: Date,
): Promise<DailyRow[]> {
  const rows = await db.transaction.groupBy({
    by: ["date", "type"],
    where: { userId, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return rows.map((r) => ({
    day: formatDay(r.date),
    type: r.type,
    amount: r._sum.amount ?? 0,
  }));
}

/** Movimentação diária do mês (base do gráfico de ritmo). */
export async function getDailyFlow(
  db: Db,
  userId: string,
  month: TransactionFilters["month"],
): Promise<DailyRow[]> {
  const { start, end } = monthRange(month);
  return dailyFlowBetween(db, userId, start, end);
}

/**
 * Média mensal dos últimos meses COMPLETOS antes de `month` (até `lookback` meses).
 * Quem ainda não tem mês completo usa o mês atual até agora (`partial: true`).
 */
export async function getRecentAverages(
  db: Db,
  userId: string,
  month: TransactionFilters["month"],
  lookback = 3,
): Promise<MonthlyAverages & { partial: boolean }> {
  const { start: currentStart } = monthRange(month);
  const { start: from } = monthRange(shiftMonth(month, -lookback));

  const history = monthlyAverages(await dailyFlowBetween(db, userId, from, currentStart));
  if (history.months > 0) return { ...history, partial: false };

  const { end } = monthRange(month);
  const current = monthlyAverages(await dailyFlowBetween(db, userId, currentStart, end));
  return { ...current, partial: true };
}
