import { describe, expect, it } from "vitest";

import { parseEnv } from "./env-schema";

const valid = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(32),
};

describe("parseEnv", () => {
  it("aceita variáveis válidas e aplica NODE_ENV padrão", () => {
    expect(parseEnv(valid).NODE_ENV).toBe("development");
  });

  it("falha com mensagem clara quando falta variável", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it("exige AUTH_SECRET com tamanho mínimo", () => {
    expect(() => parseEnv({ ...valid, AUTH_SECRET: "curto" })).toThrow(/AUTH_SECRET/);
  });
});
