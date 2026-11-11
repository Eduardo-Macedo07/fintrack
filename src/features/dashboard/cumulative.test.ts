import { describe, expect, it } from "vitest";

import { cumulativeByDay } from "./cumulative";

describe("cumulativeByDay", () => {
  it("gera um ponto por dia do mês (fevereiro bissexto e não bissexto)", () => {
    expect(cumulativeByDay("2028-02", [])).toHaveLength(29);
    expect(cumulativeByDay("2027-02", [])).toHaveLength(28);
    expect(cumulativeByDay("2026-11", [])).toHaveLength(30);
  });

  it("acumula receitas e despesas dia a dia, mantendo o valor nos dias sem movimento", () => {
    const points = cumulativeByDay("2026-11", [
      { day: "2026-11-02", type: "INCOME", amount: 500000 },
      { day: "2026-11-02", type: "EXPENSE", amount: 1000 },
      { day: "2026-11-05", type: "EXPENSE", amount: 2500 },
      { day: "2026-11-05", type: "EXPENSE", amount: 500 },
    ]);
    expect(points[0]).toEqual({ day: 1, income: 0, expense: 0 });
    expect(points[1]).toEqual({ day: 2, income: 500000, expense: 1000 });
    expect(points[2]).toEqual({ day: 3, income: 500000, expense: 1000 });
    expect(points[4]).toEqual({ day: 5, income: 500000, expense: 4000 });
    expect(points[29]).toEqual({ day: 30, income: 500000, expense: 4000 });
  });

  it("o último ponto é igual ao total do mês", () => {
    const rows = [
      { day: "2026-11-30", type: "EXPENSE" as const, amount: 700 },
      { day: "2026-11-01", type: "INCOME" as const, amount: 900 },
    ];
    const last = cumulativeByDay("2026-11", rows).at(-1);
    expect(last).toMatchObject({ income: 900, expense: 700 });
  });
});
