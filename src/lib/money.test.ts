import { describe, expect, it } from "vitest";

import { formatBRL, splitInstallments, toCents } from "./money";

describe("toCents", () => {
  it("converte números sem erro de ponto flutuante", () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(19.9)).toBe(1990);
  });

  it("interpreta texto no formato brasileiro", () => {
    expect(toCents("1.234,56")).toBe(123456);
    expect(toCents("R$ 10,5")).toBe(1050);
    expect(toCents("-7,00")).toBe(-700);
  });

  it("rejeita valores inválidos", () => {
    expect(() => toCents("abc")).toThrow(RangeError);
    expect(() => toCents("1,234")).toThrow(RangeError);
    expect(() => toCents(Number.NaN)).toThrow(RangeError);
  });
});

describe("formatBRL", () => {
  it("formata centavos como moeda", () => {
    expect(formatBRL(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });
});

describe("splitInstallments", () => {
  it("não perde centavos e coloca o resto nas primeiras parcelas", () => {
    expect(splitInstallments(1000, 3)).toEqual([334, 333, 333]);
  });

  it("a soma das parcelas é sempre igual ao total", () => {
    for (const [total, parts] of [
      [9999, 7],
      [1, 3],
      [100000, 12],
    ] as const) {
      const sum = splitInstallments(total, parts).reduce((a, b) => a + b, 0);
      expect(sum).toBe(total);
    }
  });

  it("valida o número de parcelas", () => {
    expect(() => splitInstallments(100, 0)).toThrow(RangeError);
    expect(() => splitInstallments(100, 1.5)).toThrow(RangeError);
  });
});
