import { describe, expect, it } from "vitest";

import {
  InvalidCategoryError,
  NotFoundError,
} from "@/features/transactions/server/service";

import {
  addDemoTransactions,
  addUser,
  createTransaction,
  deleteTransaction,
  EmailTakenError,
  emptyState,
  getDailyFlow,
  getMonthSummary,
  getRecentAverages,
  listCategories,
  listTransactions,
  updateTransaction,
  type DemoState,
} from "./data";

let counter = 0;
const newId = () => `id-${++counter}`;

function twoUsers() {
  const a = addUser(
    emptyState(),
    { name: "Ana", email: "ana@x.com", salt: "s", passwordHash: "h" },
    newId,
  );
  const b = addUser(
    a.state,
    { name: "Beto", email: "beto@x.com", salt: "s", passwordHash: "h" },
    newId,
  );
  const cat = (state: DemoState, userId: string, name: string) =>
    listCategories(state, userId).find((c) => c.name === name)!.id;
  return { state: b.state, ana: a.user.id, beto: b.user.id, cat };
}

const base = {
  type: "EXPENSE",
  amount: 5000,
  description: "Mercado",
  date: "2026-11-10",
};

describe("usuários e categorias", () => {
  it("cada usuário recebe as próprias 11 categorias padrão", () => {
    const { state, ana, beto } = twoUsers();
    expect(listCategories(state, ana)).toHaveLength(11);
    const ids = new Set(listCategories(state, ana).map((c) => c.id));
    expect(listCategories(state, beto).some((c) => ids.has(c.id))).toBe(false);
  });

  it("recusa e-mail repetido", () => {
    const { state } = twoUsers();
    expect(() =>
      addUser(
        state,
        { name: "Outra", email: "ana@x.com", salt: "s", passwordHash: "h" },
        newId,
      ),
    ).toThrow(EmailTakenError);
  });
});

describe("transações: mesmas regras do serviço real", () => {
  it("cria com centavos, data de calendário e categoria", () => {
    const { state, ana, cat } = twoUsers();
    const { transaction } = createTransaction(
      state,
      ana,
      { ...base, amount: "1990", categoryId: cat(state, ana, "Alimentação") },
      newId,
    );
    expect(transaction).toMatchObject({ amount: 1990, date: "2026-11-10" });
    expect(transaction.category?.name).toBe("Alimentação");
  });

  it("recusa categoria de outro usuário e de tipo diferente", () => {
    const { state, ana, beto, cat } = twoUsers();
    expect(() =>
      createTransaction(
        state,
        ana,
        { ...base, categoryId: cat(state, beto, "Alimentação") },
        newId,
      ),
    ).toThrow(InvalidCategoryError);
    expect(() =>
      createTransaction(
        state,
        ana,
        { ...base, categoryId: cat(state, ana, "Salário") },
        newId,
      ),
    ).toThrow(InvalidCategoryError);
  });

  it.each([
    { amount: 0 },
    { amount: -1 },
    { description: "  " },
    { date: "2026-02-31" },
    { type: "X" },
  ])("valida a entrada: %o", (patch) => {
    const { state, ana } = twoUsers();
    expect(() => createTransaction(state, ana, { ...base, ...patch }, newId)).toThrow();
  });

  it("outro usuário não edita nem apaga (responde 'não encontrada')", () => {
    const { state, ana, beto } = twoUsers();
    const created = createTransaction(state, ana, base, newId);
    const id = created.transaction.id;
    expect(() =>
      updateTransaction(created.state, beto, id, { ...base, amount: 1 }),
    ).toThrow(NotFoundError);
    expect(() => deleteTransaction(created.state, beto, id)).toThrow(NotFoundError);
    expect(() => deleteTransaction(created.state, ana, "nao-existe")).toThrow(
      NotFoundError,
    );

    const edited = updateTransaction(created.state, ana, id, { ...base, amount: 7500 });
    expect(edited.transaction.amount).toBe(7500);
    expect(
      listTransactions(deleteTransaction(edited.state, ana, id), ana, {
        month: "2026-11",
      }),
    ).toEqual([]);
  });

  it("não altera o estado anterior (imutável)", () => {
    const { state, ana } = twoUsers();
    const before = state.transactions.length;
    createTransaction(state, ana, base, newId);
    expect(state.transactions).toHaveLength(before);
  });
});

describe("consultas", () => {
  function scenario() {
    const u = twoUsers();
    let s = u.state;
    const add = (userId: string, input: object) => {
      s = createTransaction(s, userId, { ...base, ...input }, newId).state;
    };
    add(u.ana, { date: "2026-10-31", description: "Fim de outubro", amount: 200000 });
    add(u.ana, {
      type: "INCOME",
      date: "2026-10-05",
      description: "Renda out",
      amount: 500000,
    });
    add(u.ana, {
      date: "2026-11-01",
      description: "Início de novembro",
      amount: 30000,
      categoryId: u.cat(s, u.ana, "Alimentação"),
    });
    add(u.ana, { date: "2026-11-30", description: "Fim de novembro", amount: 10000 });
    add(u.ana, {
      type: "INCOME",
      date: "2026-11-05",
      description: "Renda nov",
      amount: 500000,
    });
    add(u.ana, { date: "2026-12-01", description: "Dezembro", amount: 999999 });
    add(u.beto, { date: "2026-11-15", description: "Do Beto", amount: 777777 });
    return { ...u, state: s };
  }

  it("lista só o mês, só do usuário, da mais recente para a mais antiga", () => {
    const { state, ana } = scenario();
    const list = listTransactions(state, ana, { month: "2026-11" });
    expect(list.map((t) => t.description)).toEqual([
      "Fim de novembro",
      "Renda nov",
      "Início de novembro",
    ]);
  });

  it("filtra por tipo, categoria e busca sem diferenciar maiúsculas", () => {
    const { state, ana, beto, cat } = scenario();
    expect(
      listTransactions(state, ana, { month: "2026-11", type: "INCOME" }),
    ).toHaveLength(1);
    expect(listTransactions(state, ana, { month: "2026-11", q: "INÍCIO" })).toHaveLength(
      1,
    );
    expect(
      listTransactions(state, ana, {
        month: "2026-11",
        categoryId: cat(state, ana, "Alimentação"),
      }),
    ).toHaveLength(1);
    expect(
      listTransactions(state, ana, {
        month: "2026-11",
        categoryId: cat(state, beto, "Alimentação"),
      }),
    ).toEqual([]);
  });

  it("resumo: mês separado do saldo acumulado, sem misturar usuários nem meses futuros", () => {
    const { state, ana } = scenario();
    const nov = getMonthSummary(state, ana, "2026-11");
    expect(nov).toMatchObject({ income: 500000, expense: 40000, net: 460000 });
    expect(nov.balance).toBe(500000 - 200000 + 500000 - 40000);
    expect(nov.expensesByCategory.map((c) => [c.name, c.amount])).toEqual([
      ["Alimentação", 30000],
      ["Sem categoria", 10000],
    ]);
    expect(getMonthSummary(state, ana, "2026-10").balance).toBe(300000);
  });

  it("fluxo diário e médias dos meses completos", () => {
    const { state, ana } = scenario();
    expect(getDailyFlow(state, ana, "2026-11")).toHaveLength(3);
    expect(getRecentAverages(state, ana, "2026-11")).toMatchObject({
      months: 1,
      income: 500000,
      expense: 200000,
      net: 300000,
      partial: false,
    });
    expect(getRecentAverages(state, ana, "2026-10")).toMatchObject({
      months: 1,
      partial: true,
    });
  });

  it("a conta de demonstração recebe os dados de exemplo com categoria", () => {
    const { state, ana } = twoUsers();
    const filled = addDemoTransactions(state, ana, "2026-11", 11, newId);
    const all = ["2026-08", "2026-09", "2026-10", "2026-11"].flatMap((m) =>
      listTransactions(filled, ana, { month: m }),
    );
    expect(all).toHaveLength(53);
    expect(all.every((t) => t.category !== null)).toBe(true);
  });
});
