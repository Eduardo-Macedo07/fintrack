import { beforeEach, describe, expect, it } from "vitest";

import { registerUser } from "@/features/auth/server/register";
import { prisma, resetDb } from "../../../../tests/db";
import {
  createTransaction,
  deleteTransaction,
  getDailyFlow,
  getMonthSummary,
  InvalidCategoryError,
  listCategories,
  listTransactions,
  NotFoundError,
  updateTransaction,
} from "./service";

async function newUser(email: string) {
  const user = await registerUser(prisma, {
    name: "Teste",
    email,
    password: "senha-forte-1",
  });
  const categories = await listCategories(prisma, user.id);
  const cat = (name: string) => categories.find((c) => c.name === name)!.id;
  return { id: user.id, cat };
}

const base = {
  type: "EXPENSE" as const,
  amount: 5000,
  description: "Mercado",
  date: "2026-11-10",
};

let ana: Awaited<ReturnType<typeof newUser>>;
let beto: Awaited<ReturnType<typeof newUser>>;

beforeEach(async () => {
  await resetDb();
  ana = await newUser("ana@example.com");
  beto = await newUser("beto@example.com");
});

describe("createTransaction", () => {
  it("guarda centavos, data de calendário e usa a conta padrão", async () => {
    const t = await createTransaction(prisma, ana.id, {
      ...base,
      categoryId: ana.cat("Alimentação"),
    });
    expect(t).toMatchObject({ amount: 5000, date: "2026-11-10", description: "Mercado" });
    expect(t.category?.name).toBe("Alimentação");

    const row = await prisma.transaction.findUniqueOrThrow({
      where: { id: t.id },
      include: { account: true },
    });
    expect(row.date.toISOString()).toBe("2026-11-10T00:00:00.000Z");
    expect(row.account.name).toBe("Carteira");
    expect(row.userId).toBe(ana.id);
  });

  it("aceita valor vindo do formulário como texto e categoria vazia", async () => {
    const t = await createTransaction(prisma, ana.id, {
      ...base,
      amount: "1990",
      categoryId: "",
    });
    expect(t.amount).toBe(1990);
    expect(t.category).toBeNull();
  });

  it("recusa categoria de OUTRO usuário", async () => {
    await expect(
      createTransaction(prisma, ana.id, { ...base, categoryId: beto.cat("Alimentação") }),
    ).rejects.toBeInstanceOf(InvalidCategoryError);
    expect(await prisma.transaction.count()).toBe(0);
  });

  it("recusa categoria de tipo diferente do da transação", async () => {
    await expect(
      createTransaction(prisma, ana.id, { ...base, categoryId: ana.cat("Salário") }),
    ).rejects.toBeInstanceOf(InvalidCategoryError);
  });

  it.each([
    ["valor zero", { amount: 0 }],
    ["valor negativo", { amount: -100 }],
    ["valor com casas decimais", { amount: 10.5 }],
    ["valor acima do limite", { amount: 1_000_000_001 }],
    ["descrição vazia", { description: "   " }],
    ["descrição longa demais", { description: "x".repeat(101) }],
    ["data inexistente", { date: "2026-02-31" }],
    ["tipo inválido", { type: "TRANSFER" }],
  ])("valida a entrada: %s", async (_name, patch) => {
    await expect(
      createTransaction(prisma, ana.id, { ...base, ...patch }),
    ).rejects.toThrow();
    expect(await prisma.transaction.count()).toBe(0);
  });
});

describe("updateTransaction / deleteTransaction", () => {
  it("o dono edita e apaga", async () => {
    const t = await createTransaction(prisma, ana.id, base);
    const edited = await updateTransaction(prisma, ana.id, t.id, {
      ...base,
      amount: 7500,
      description: "Feira",
    });
    expect(edited).toMatchObject({ id: t.id, amount: 7500, description: "Feira" });

    await deleteTransaction(prisma, ana.id, t.id);
    expect(await prisma.transaction.count()).toBe(0);
  });

  it("OUTRO usuário não consegue editar: erro 'não encontrada' e nada muda", async () => {
    const t = await createTransaction(prisma, ana.id, base);
    await expect(
      updateTransaction(prisma, beto.id, t.id, { ...base, amount: 1 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(
      (await prisma.transaction.findUniqueOrThrow({ where: { id: t.id } })).amount,
    ).toBe(5000);
  });

  it("OUTRO usuário não consegue apagar", async () => {
    const t = await createTransaction(prisma, ana.id, base);
    await expect(deleteTransaction(prisma, beto.id, t.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(await prisma.transaction.count()).toBe(1);
  });

  it("id inexistente responde igual a id de outro usuário", async () => {
    await expect(deleteTransaction(prisma, ana.id, "nao-existe")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("ao editar, também valida a categoria nova", async () => {
    const t = await createTransaction(prisma, ana.id, base);
    await expect(
      updateTransaction(prisma, ana.id, t.id, { ...base, categoryId: beto.cat("Lazer") }),
    ).rejects.toBeInstanceOf(InvalidCategoryError);
  });
});

describe("listTransactions", () => {
  beforeEach(async () => {
    const food = ana.cat("Alimentação");
    await createTransaction(prisma, ana.id, {
      ...base,
      date: "2026-10-31",
      description: "Fim de outubro",
    });
    await createTransaction(prisma, ana.id, {
      ...base,
      date: "2026-11-01",
      description: "Início de novembro",
      categoryId: food,
    });
    await createTransaction(prisma, ana.id, {
      ...base,
      date: "2026-11-30",
      description: "Fim de novembro",
    });
    await createTransaction(prisma, ana.id, {
      ...base,
      date: "2026-12-01",
      description: "Início de dezembro",
    });
    await createTransaction(prisma, ana.id, {
      type: "INCOME",
      amount: 300000,
      description: "Salário",
      date: "2026-11-05",
      categoryId: ana.cat("Salário"),
    });
    await createTransaction(prisma, beto.id, {
      ...base,
      date: "2026-11-15",
      description: "Do Beto",
    });
  });

  it("respeita os limites do mês (1º e último dia entram, vizinhos não)", async () => {
    const list = await listTransactions(prisma, ana.id, { month: "2026-11" });
    expect(list.map((t) => t.description).sort()).toEqual(
      ["Fim de novembro", "Início de novembro", "Salário"].sort(),
    );
  });

  it("nunca retorna transações de outro usuário", async () => {
    const list = await listTransactions(prisma, ana.id, { month: "2026-11" });
    expect(list.some((t) => t.description === "Do Beto")).toBe(false);
  });

  it("ordena da mais recente para a mais antiga", async () => {
    const list = await listTransactions(prisma, ana.id, { month: "2026-11" });
    expect(list.map((t) => t.date)).toEqual(["2026-11-30", "2026-11-05", "2026-11-01"]);
  });

  it("filtra por tipo, categoria e busca (sem diferenciar maiúsculas)", async () => {
    expect(
      await listTransactions(prisma, ana.id, { month: "2026-11", type: "INCOME" }),
    ).toHaveLength(1);
    expect(
      await listTransactions(prisma, ana.id, {
        month: "2026-11",
        categoryId: ana.cat("Alimentação"),
      }),
    ).toHaveLength(1);
    // Sem diferenciar maiúsculas (o acento é o mesmo, só muda a caixa).
    expect(
      await listTransactions(prisma, ana.id, { month: "2026-11", q: "INÍCIO" }),
    ).toHaveLength(1);
    expect(
      await listTransactions(prisma, ana.id, { month: "2026-11", q: "início" }),
    ).toHaveLength(1);
    expect(
      await listTransactions(prisma, ana.id, { month: "2026-11", q: "zzz" }),
    ).toHaveLength(0);
  });

  it("filtro por categoria de outro usuário não vaza nada", async () => {
    const list = await listTransactions(prisma, ana.id, {
      month: "2026-11",
      categoryId: beto.cat("Alimentação"),
    });
    expect(list).toEqual([]);
  });

  it("mês inválido cai no mês atual em vez de quebrar", async () => {
    await expect(
      listTransactions(prisma, ana.id, { month: "lixo" }),
    ).resolves.toBeInstanceOf(Array);
  });
});

describe("getMonthSummary", () => {
  it("usuário sem transações tem tudo zerado", async () => {
    expect(await getMonthSummary(prisma, ana.id, "2026-11")).toMatchObject({
      income: 0,
      expense: 0,
      net: 0,
      balance: 0,
      expensesByCategory: [],
    });
  });

  it("separa o mês do saldo acumulado e inclui o saldo inicial", async () => {
    await prisma.account.updateMany({
      where: { userId: ana.id },
      data: { initialBalance: 100000 },
    });
    const food = ana.cat("Alimentação");
    const rent = ana.cat("Moradia");

    await createTransaction(prisma, ana.id, {
      type: "INCOME",
      amount: 500000,
      description: "Salário out",
      date: "2026-10-05",
      categoryId: ana.cat("Salário"),
    });
    await createTransaction(prisma, ana.id, {
      type: "EXPENSE",
      amount: 200000,
      description: "Aluguel out",
      date: "2026-10-10",
      categoryId: rent,
    });
    await createTransaction(prisma, ana.id, {
      type: "INCOME",
      amount: 500000,
      description: "Salário nov",
      date: "2026-11-05",
      categoryId: ana.cat("Salário"),
    });
    await createTransaction(prisma, ana.id, {
      type: "EXPENSE",
      amount: 30000,
      description: "Mercado",
      date: "2026-11-08",
      categoryId: food,
    });
    await createTransaction(prisma, ana.id, {
      type: "EXPENSE",
      amount: 10000,
      description: "Feira",
      date: "2026-11-20",
      categoryId: food,
    });
    await createTransaction(prisma, ana.id, {
      type: "EXPENSE",
      amount: 5000,
      description: "Sem categoria",
      date: "2026-11-21",
    });
    await createTransaction(prisma, ana.id, {
      type: "EXPENSE",
      amount: 999999,
      description: "Dezembro",
      date: "2026-12-02",
    });

    const nov = await getMonthSummary(prisma, ana.id, "2026-11");
    expect(nov.income).toBe(500000);
    expect(nov.expense).toBe(45000);
    expect(nov.net).toBe(455000);
    // 1.000,00 inicial + (5.000 − 2.000) de outubro + (5.000 − 450) de novembro = 8.550,00
    expect(nov.balance).toBe(855000);
    expect(nov.expensesByCategory.map((c) => [c.name, c.amount])).toEqual([
      ["Alimentação", 40000],
      ["Sem categoria", 5000],
    ]);

    // Em outubro, o saldo não enxerga novembro.
    const oct = await getMonthSummary(prisma, ana.id, "2026-10");
    expect(oct.balance).toBe(100000 + 500000 - 200000);
  });

  it("não mistura dados de usuários diferentes", async () => {
    await createTransaction(prisma, beto.id, { ...base, amount: 999900 });
    const summary = await getMonthSummary(prisma, ana.id, "2026-11");
    expect(summary.expense).toBe(0);
    expect(summary.balance).toBe(0);
  });
});

describe("getDailyFlow", () => {
  it("agrupa por dia e tipo, só do mês e só do usuário", async () => {
    await createTransaction(prisma, ana.id, {
      ...base,
      amount: 1000,
      date: "2026-11-03",
    });
    await createTransaction(prisma, ana.id, {
      ...base,
      amount: 2000,
      date: "2026-11-03",
    });
    await createTransaction(prisma, ana.id, {
      type: "INCOME",
      amount: 9000,
      description: "Pix",
      date: "2026-11-03",
    });
    await createTransaction(prisma, ana.id, { ...base, date: "2026-12-01" });
    await createTransaction(prisma, beto.id, { ...base, date: "2026-11-03" });

    const rows = await getDailyFlow(prisma, ana.id, "2026-11");
    expect(rows).toHaveLength(2);
    expect(rows).toContainEqual({ day: "2026-11-03", type: "EXPENSE", amount: 3000 });
    expect(rows).toContainEqual({ day: "2026-11-03", type: "INCOME", amount: 9000 });
  });
});
