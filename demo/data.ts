/**
 * Dados da versão de demonstração: funções PURAS sobre um estado imutável.
 *
 * É o equivalente, no navegador, de `features/transactions/server/service.ts`:
 * mesmas validações (Zod), mesmo isolamento por usuário e as mesmas funções de cálculo
 * (saldo, médias). A diferença é só onde os dados moram (memória + localStorage, não PostgreSQL).
 */
import { DEFAULT_CATEGORIES } from "@/features/categories/default-categories";
import type { DailyRow } from "@/features/dashboard/cumulative";
import { buildDemoTransactions } from "@/features/demo/demo-data";
import { monthlyAverages, type MonthlyAverages } from "@/features/planning/averages";
import { balanceOf } from "@/features/transactions/balance";
import {
  transactionFiltersSchema,
  transactionInputSchema,
} from "@/features/transactions/schemas";
import {
  InvalidCategoryError,
  NotFoundError,
  type MonthSummary,
  type TransactionDTO,
} from "@/features/transactions/server/service";
import { formatDay, shiftMonth, type MonthKey } from "@/lib/dates";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
};

export type DemoCategory = {
  id: string;
  userId: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
};

export type DemoTx = {
  id: string;
  userId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  categoryId: string | null;
  /** Ordem de criação, para desempatar transações do mesmo dia. */
  seq: number;
};

export type DemoState = {
  users: DemoUser[];
  categories: DemoCategory[];
  transactions: DemoTx[];
  sessionUserId: string | null;
  nextSeq: number;
};

export const emptyState = (): DemoState => ({
  users: [],
  categories: [],
  transactions: [],
  sessionUserId: null,
  nextSeq: 1,
});

export class EmailTakenError extends Error {
  constructor() {
    super("Já existe uma conta com este e-mail");
    this.name = "EmailTakenError";
  }
}

type NewId = () => string;

/** Cria o usuário e as categorias padrão dele (como o cadastro real). O e-mail já chega normalizado. */
export function addUser(
  state: DemoState,
  user: Omit<DemoUser, "id">,
  newId: NewId,
): { state: DemoState; user: DemoUser } {
  if (state.users.some((u) => u.email === user.email)) throw new EmailTakenError();
  const created = { ...user, id: newId() };
  const categories = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    id: newId(),
    userId: created.id,
  }));
  return {
    user: created,
    state: {
      ...state,
      users: [...state.users, created],
      categories: [...state.categories, ...categories],
    },
  };
}

/** Preenche a conta com os 4 meses de movimentação de exemplo. */
export function addDemoTransactions(
  state: DemoState,
  userId: string,
  month: MonthKey,
  todayDay: number,
  newId: NewId,
): DemoState {
  let next = state;
  for (const t of buildDemoTransactions(month, todayDay)) {
    const category = next.categories.find(
      (c) => c.userId === userId && c.name === t.category && c.type === t.type,
    );
    next = createTransaction(
      next,
      userId,
      { ...t, categoryId: category?.id },
      newId,
    ).state;
  }
  return next;
}

export function listCategories(state: DemoState, userId: string) {
  return state.categories
    .filter((c) => c.userId === userId)
    .map(({ id, name, type, color }) => ({ id, name, type, color }))
    .sort(
      (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name, "pt-BR"),
    );
}

function toDTO(state: DemoState, tx: DemoTx): TransactionDTO {
  const category = tx.categoryId
    ? state.categories.find((c) => c.id === tx.categoryId)
    : undefined;
  return {
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
    date: tx.date,
    category: category
      ? { id: category.id, name: category.name, color: category.color }
      : null,
  };
}

/** A categoria precisa ser DESTE usuário e do mesmo tipo da transação. */
function resolveCategoryId(
  state: DemoState,
  userId: string,
  categoryId: string | undefined,
  type: "INCOME" | "EXPENSE",
): string | null {
  if (!categoryId) return null;
  const category = state.categories.find(
    (c) => c.id === categoryId && c.userId === userId,
  );
  if (!category) throw new InvalidCategoryError();
  if (category.type !== type) {
    throw new InvalidCategoryError("A categoria não combina com o tipo da transação");
  }
  return category.id;
}

export function createTransaction(
  state: DemoState,
  userId: string,
  input: unknown,
  newId: NewId,
): { state: DemoState; transaction: TransactionDTO } {
  const data = transactionInputSchema.parse(input);
  const tx: DemoTx = {
    id: newId(),
    userId,
    type: data.type,
    amount: data.amount,
    description: data.description,
    date: formatDay(data.date),
    categoryId: resolveCategoryId(state, userId, data.categoryId, data.type),
    seq: state.nextSeq,
  };
  const next = {
    ...state,
    transactions: [...state.transactions, tx],
    nextSeq: state.nextSeq + 1,
  };
  return { state: next, transaction: toDTO(next, tx) };
}

export function updateTransaction(
  state: DemoState,
  userId: string,
  id: string,
  input: unknown,
): { state: DemoState; transaction: TransactionDTO } {
  const data = transactionInputSchema.parse(input);
  const categoryId = resolveCategoryId(state, userId, data.categoryId, data.type);
  const current = state.transactions.find((t) => t.id === id && t.userId === userId);
  if (!current) throw new NotFoundError("Transação");

  const updated: DemoTx = {
    ...current,
    type: data.type,
    amount: data.amount,
    description: data.description,
    date: formatDay(data.date),
    categoryId,
  };
  const next = {
    ...state,
    transactions: state.transactions.map((t) => (t === current ? updated : t)),
  };
  return { state: next, transaction: toDTO(next, updated) };
}

export function deleteTransaction(
  state: DemoState,
  userId: string,
  id: string,
): DemoState {
  const current = state.transactions.find((t) => t.id === id && t.userId === userId);
  if (!current) throw new NotFoundError("Transação");
  return { ...state, transactions: state.transactions.filter((t) => t !== current) };
}

export function listTransactions(
  state: DemoState,
  userId: string,
  rawFilters: unknown = {},
): TransactionDTO[] {
  const filters = transactionFiltersSchema.parse(rawFilters ?? {});
  const q = filters.q?.toLocaleLowerCase("pt-BR");

  return state.transactions
    .filter(
      (t) =>
        t.userId === userId &&
        t.date.startsWith(filters.month) &&
        (!filters.type || t.type === filters.type) &&
        (!filters.categoryId || t.categoryId === filters.categoryId) &&
        (!q || t.description.toLocaleLowerCase("pt-BR").includes(q)),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.seq - a.seq)
    .map((t) => toDTO(state, t));
}

export function getMonthSummary(
  state: DemoState,
  userId: string,
  month: MonthKey,
): MonthSummary {
  const mine = state.transactions.filter((t) => t.userId === userId);
  const sum = (rows: DemoTx[], type: DemoTx["type"]) =>
    rows.reduce((total, t) => (t.type === type ? total + t.amount : total), 0);

  const inMonth = mine.filter((t) => t.date.startsWith(month));
  // "YYYY-MM" compara como texto: tudo até o fim do mês exibido.
  const untilMonth = mine.filter((t) => t.date.slice(0, 7) <= month);

  const income = sum(inMonth, "INCOME");
  const expense = sum(inMonth, "EXPENSE");

  const byCategory = new Map<string | null, number>();
  for (const t of inMonth) {
    if (t.type === "EXPENSE") {
      byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + t.amount);
    }
  }

  return {
    month,
    income,
    expense,
    net: income - expense,
    // Na demonstração não há saldo inicial de conta (contas ficam ocultas no app).
    balance: balanceOf(0, {
      income: sum(untilMonth, "INCOME"),
      expense: sum(untilMonth, "EXPENSE"),
    }),
    expensesByCategory: [...byCategory.entries()]
      .map(([categoryId, amount]) => {
        const c = categoryId
          ? state.categories.find((x) => x.id === categoryId)
          : undefined;
        return {
          categoryId,
          name: c?.name ?? "Sem categoria",
          color: c?.color ?? "#94a3b8",
          amount,
        };
      })
      .sort((a, b) => b.amount - a.amount),
  };
}

function dailyFlowWhere(
  state: DemoState,
  userId: string,
  inRange: (monthOfTx: string) => boolean,
): DailyRow[] {
  const totals = new Map<string, DailyRow>();
  for (const t of state.transactions) {
    if (t.userId !== userId || !inRange(t.date.slice(0, 7))) continue;
    const key = `${t.date}|${t.type}`;
    const row = totals.get(key) ?? { day: t.date, type: t.type, amount: 0 };
    row.amount += t.amount;
    totals.set(key, row);
  }
  return [...totals.values()];
}

export function getDailyFlow(
  state: DemoState,
  userId: string,
  month: MonthKey,
): DailyRow[] {
  return dailyFlowWhere(state, userId, (m) => m === month);
}

/** Média dos últimos meses COMPLETOS antes de `month`; sem histórico, usa o mês atual (parcial). */
export function getRecentAverages(
  state: DemoState,
  userId: string,
  month: MonthKey,
  lookback = 3,
): MonthlyAverages & { partial: boolean } {
  const from = shiftMonth(month, -lookback);
  const history = monthlyAverages(
    dailyFlowWhere(state, userId, (m) => m >= from && m < month),
  );
  if (history.months > 0) return { ...history, partial: false };
  return { ...monthlyAverages(getDailyFlow(state, userId, month)), partial: true };
}
