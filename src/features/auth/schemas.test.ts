import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./schemas";

describe("registerSchema", () => {
  const valid = { name: "Ana", email: "ana@example.com", password: "senha-forte-1" };

  it("normaliza o e-mail (trim e minúsculas) e o nome", () => {
    const r = registerSchema.parse({
      ...valid,
      name: "  Ana  ",
      email: "  ANA@Example.COM ",
    });
    expect(r.email).toBe("ana@example.com");
    expect(r.name).toBe("Ana");
  });

  it("rejeita e-mail inválido, senha curta e nome curto", () => {
    expect(registerSchema.safeParse({ ...valid, email: "nao-e-email" }).success).toBe(
      false,
    );
    expect(registerSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(
      false,
    );
    expect(registerSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("limita a senha a 72 bytes (limite do bcrypt), contando bytes e não caracteres", () => {
    expect(registerSchema.safeParse({ ...valid, password: "a".repeat(72) }).success).toBe(
      true,
    );
    expect(registerSchema.safeParse({ ...valid, password: "a".repeat(73) }).success).toBe(
      false,
    );
    // 37 caracteres de 2 bytes = 74 bytes
    expect(registerSchema.safeParse({ ...valid, password: "é".repeat(37) }).success).toBe(
      false,
    );
  });
});

describe("loginSchema", () => {
  it("exige senha e e-mail válido", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "x", password: "123" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "A@B.co", password: "123" }).success).toBe(
      true,
    );
  });
});
