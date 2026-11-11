import { describe, expect, it } from "vitest";

import { balanceOf, totalsByType } from "./balance";

describe("totalsByType", () => {
  it("soma receitas e despesas separadamente", () => {
    expect(
      totalsByType([
        { type: "INCOME", _sum: { amount: 500000 } },
        { type: "EXPENSE", _sum: { amount: 123456 } },
      ]),
    ).toEqual({ income: 500000, expense: 123456 });
  });

  it("trata ausência de linhas e soma nula como zero", () => {
    expect(totalsByType([])).toEqual({ income: 0, expense: 0 });
    expect(totalsByType([{ type: "EXPENSE", _sum: { amount: null } }])).toEqual({
      income: 0,
      expense: 0,
    });
  });
});

describe("balanceOf", () => {
  it("considera o saldo inicial", () => {
    expect(balanceOf(100000, { income: 50000, expense: 20000 })).toBe(130000);
  });

  it("pode ficar negativo", () => {
    expect(balanceOf(0, { income: 1000, expense: 5000 })).toBe(-4000);
  });
});
