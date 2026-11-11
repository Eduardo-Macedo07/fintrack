import { beforeEach, describe, expect, it } from "vitest";

import { prisma, resetDb } from "../../../../tests/db";
import { DEFAULT_CATEGORIES } from "@/features/categories/default-categories";
import { authenticate } from "./authenticate";
import { EmailTakenError, registerUser } from "./register";

const ana = { name: "Ana", email: "ana@example.com", password: "senha-forte-1" };

beforeEach(resetDb);

describe("registerUser", () => {
  it("cria usuário com senha em hash, conta inicial e categorias padrão", async () => {
    const user = await registerUser(prisma, ana);

    const row = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { accounts: true, categories: true },
    });
    expect(row.passwordHash).not.toBe(ana.password);
    expect(row.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(row.accounts.map((a) => a.name)).toEqual(["Carteira"]);
    expect(row.categories).toHaveLength(DEFAULT_CATEGORIES.length);
  });

  it("não devolve o hash da senha", async () => {
    const user = await registerUser(prisma, ana);
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("rejeita e-mail repetido, mesmo com maiúsculas diferentes", async () => {
    await registerUser(prisma, ana);
    await expect(
      registerUser(prisma, { ...ana, email: "ANA@example.com" }),
    ).rejects.toBeInstanceOf(EmailTakenError);
    expect(await prisma.user.count()).toBe(1);
  });

  it("duas requisições simultâneas com o mesmo e-mail criam só um usuário", async () => {
    const results = await Promise.allSettled([
      registerUser(prisma, ana),
      registerUser(prisma, ana),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.user.count()).toBe(1);
  });

  it("não deixa dados órfãos quando a criação falha (tudo ou nada)", async () => {
    await registerUser(prisma, ana);
    await expect(registerUser(prisma, ana)).rejects.toBeInstanceOf(EmailTakenError);
    expect(await prisma.account.count()).toBe(1);
    expect(await prisma.category.count()).toBe(DEFAULT_CATEGORIES.length);
  });

  it("valida a entrada", async () => {
    await expect(registerUser(prisma, { ...ana, password: "curta" })).rejects.toThrow();
    expect(await prisma.user.count()).toBe(0);
  });
});

describe("authenticate", () => {
  beforeEach(async () => {
    await registerUser(prisma, ana);
  });

  it("aceita credenciais corretas (e-mail case-insensitive)", async () => {
    const user = await authenticate(prisma, {
      email: "ANA@example.com",
      password: ana.password,
    });
    expect(user).toMatchObject({ name: "Ana", email: "ana@example.com" });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("recusa senha errada e e-mail inexistente da mesma forma", async () => {
    const wrongPassword = await authenticate(prisma, {
      email: ana.email,
      password: "errada-123",
    });
    const unknownEmail = await authenticate(prisma, {
      email: "x@example.com",
      password: ana.password,
    });
    expect(wrongPassword).toBeNull();
    expect(unknownEmail).toBeNull();
  });

  it("recusa entrada malformada sem lançar erro", async () => {
    expect(await authenticate(prisma, null)).toBeNull();
    expect(await authenticate(prisma, { email: "x" })).toBeNull();
  });
});
