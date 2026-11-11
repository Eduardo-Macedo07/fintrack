import { describe, expect, it } from "vitest";

import {
  formatDuration,
  inTodaysMoney,
  monthsToTarget,
  projectSavings,
} from "./projection";

describe("projectSavings", () => {
  it("sem rendimento, o total é só o que foi guardado", () => {
    const p = projectSavings({ monthly: 100_000, annualRatePct: 0, months: 12 });
    expect(p.total).toBe(1_200_000);
    expect(p.interest).toBe(0);
    expect(p.points).toHaveLength(13); // do mês 0 ao 12
  });

  it("inclui o aporte inicial", () => {
    const p = projectSavings({
      initial: 500_000,
      monthly: 0,
      annualRatePct: 0,
      months: 6,
    });
    expect(p.total).toBe(500_000);
    expect(p.contributed).toBe(500_000);
  });

  it("bate com a fórmula fechada de valor futuro de anuidade", () => {
    const monthly = 100_000; // R$ 1.000,00
    const rate = 12;
    const n = 60;
    const r = Math.pow(1.12, 1 / 12) - 1;
    const closed = monthly * ((Math.pow(1 + r, n) - 1) / r);
    const p = projectSavings({ monthly, annualRatePct: rate, months: n });
    expect(Math.abs(p.total - closed)).toBeLessThanOrEqual(2); // ≤ 2 centavos de arredondamento
  });

  it("usa a taxa mensal EQUIVALENTE: 12 meses a 12% ao ano rendem exatamente 12% sobre o inicial", () => {
    const p = projectSavings({
      initial: 1_000_000,
      monthly: 0,
      annualRatePct: 12,
      months: 12,
    });
    expect(p.total).toBe(1_120_000);
  });

  it("rendimento = total − guardado, e cresce com a taxa", () => {
    const low = projectSavings({ monthly: 50_000, annualRatePct: 6, months: 120 });
    const high = projectSavings({ monthly: 50_000, annualRatePct: 14, months: 120 });
    expect(low.interest).toBe(low.total - low.contributed);
    expect(high.total).toBeGreaterThan(low.total);
    expect(high.contributed).toBe(low.contributed);
  });

  it("período zero devolve só o ponto inicial", () => {
    const p = projectSavings({ initial: 100, monthly: 50, annualRatePct: 10, months: 0 });
    expect(p.points).toEqual([{ month: 0, contributed: 100, total: 100 }]);
  });

  it("valida os limites", () => {
    expect(() => projectSavings({ monthly: 1, annualRatePct: -1, months: 1 })).toThrow(
      RangeError,
    );
    expect(() => projectSavings({ monthly: 1, annualRatePct: 101, months: 1 })).toThrow(
      RangeError,
    );
    expect(() =>
      projectSavings({ monthly: 1, annualRatePct: Number.NaN, months: 1 }),
    ).toThrow(RangeError);
    expect(() => projectSavings({ monthly: -1, annualRatePct: 5, months: 1 })).toThrow(
      RangeError,
    );
    expect(() => projectSavings({ monthly: 1, annualRatePct: 5, months: 601 })).toThrow(
      RangeError,
    );
    expect(() => projectSavings({ monthly: 1, annualRatePct: 5, months: 1.5 })).toThrow(
      RangeError,
    );
  });
});

describe("monthsToTarget", () => {
  it("sem rendimento é divisão (arredondada para cima)", () => {
    expect(
      monthsToTarget({ target: 1_000_000, monthly: 300_000, annualRatePct: 0 }),
    ).toBe(4);
  });

  it("com rendimento chega mais rápido que sem", () => {
    const without = monthsToTarget({
      target: 6_000_000,
      monthly: 200_000,
      annualRatePct: 0,
    })!;
    const withReturn = monthsToTarget({
      target: 6_000_000,
      monthly: 200_000,
      annualRatePct: 12,
    })!;
    expect(withReturn).toBeLessThan(without);
  });

  it("meta já atingida é 0; sem aporte e sem rendimento é impossível", () => {
    expect(
      monthsToTarget({ target: 100, initial: 100, monthly: 0, annualRatePct: 0 }),
    ).toBe(0);
    expect(monthsToTarget({ target: 100, monthly: 0, annualRatePct: 0 })).toBeNull();
  });

  it("respeita o limite de meses", () => {
    expect(
      monthsToTarget({
        target: 1_000_000_000,
        monthly: 100,
        annualRatePct: 0,
        maxMonths: 12,
      }),
    ).toBeNull();
  });

  it("é coerente com projectSavings", () => {
    const params = { monthly: 150_000, annualRatePct: 10 };
    const m = monthsToTarget({ ...params, target: 5_000_000 })!;
    expect(projectSavings({ ...params, months: m }).total).toBeGreaterThanOrEqual(
      5_000_000,
    );
    expect(projectSavings({ ...params, months: m - 1 }).total).toBeLessThan(5_000_000);
  });
});

describe("inTodaysMoney", () => {
  it("desconta a inflação acumulada", () => {
    expect(inTodaysMoney(1_050_000, 5, 12)).toBe(1_000_000);
  });
  it("sem inflação não muda nada", () => {
    expect(inTodaysMoney(123_456, 0, 60)).toBe(123_456);
  });
});

describe("formatDuration", () => {
  it("fala em anos e meses com singular/plural certos", () => {
    expect(formatDuration(8)).toBe("8 meses");
    expect(formatDuration(1)).toBe("1 mês");
    expect(formatDuration(12)).toBe("1 ano");
    expect(formatDuration(15)).toBe("1 ano e 3 meses");
    expect(formatDuration(24)).toBe("2 anos");
    expect(formatDuration(25)).toBe("2 anos e 1 mês");
  });
});
