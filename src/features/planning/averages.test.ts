import { describe, expect, it } from "vitest";

import { monthlyAverages } from "./averages";

describe("monthlyAverages", () => {
  it("sem dados, tudo zero", () => {
    expect(monthlyAverages([])).toEqual({ months: 0, income: 0, expense: 0, net: 0 });
  });

  it("tira a média por mês com movimento", () => {
    const a = monthlyAverages([
      { day: "2026-08-05", type: "INCOME", amount: 500_000 },
      { day: "2026-08-10", type: "EXPENSE", amount: 300_000 },
      { day: "2026-09-05", type: "INCOME", amount: 500_000 },
      { day: "2026-09-12", type: "EXPENSE", amount: 400_000 },
      { day: "2026-09-20", type: "EXPENSE", amount: 50_000 },
    ]);
    expect(a.months).toBe(2);
    expect(a.income).toBe(500_000);
    expect(a.expense).toBe(375_000); // (300.000 + 450.000) / 2
    expect(a.net).toBe(125_000);
  });

  it("não dilui a média com meses vazios (só 1 mês de uso = divide por 1)", () => {
    const a = monthlyAverages([{ day: "2026-10-03", type: "EXPENSE", amount: 90_000 }]);
    expect(a.months).toBe(1);
    expect(a.expense).toBe(90_000);
  });

  it("média negativa quando gasta mais do que entra", () => {
    const a = monthlyAverages([
      { day: "2026-10-01", type: "INCOME", amount: 100_000 },
      { day: "2026-10-02", type: "EXPENSE", amount: 150_000 },
    ]);
    expect(a.net).toBe(-50_000);
  });
});
