import { describe, expect, it } from "vitest";

import { weeklyBudget } from "./budget";

describe("weeklyBudget", () => {
  it("divide o que sobra pelos dias restantes (contando hoje)", () => {
    // 10 de novembro (30 dias): faltam 21 dias; R$ 2.100,00 → R$ 100,00 por dia, R$ 700,00 por semana
    expect(weeklyBudget({ net: 210_000, todayDay: 10, daysInMonth: 30 })).toEqual({
      perDay: 10_000,
      perWeek: 70_000,
      daysLeft: 21,
      over: false,
    });
  });

  it("no último dia do mês, falta 1 dia e a semana não passa do que sobra", () => {
    const b = weeklyBudget({ net: 30_000, todayDay: 30, daysInMonth: 30 });
    expect(b.daysLeft).toBe(1);
    expect(b.perDay).toBe(30_000);
    expect(b.perWeek).toBe(30_000); // e não 210.000
  });

  it("com poucos dias restantes, a semana é limitada ao saldo", () => {
    const b = weeklyBudget({ net: 30_000, todayDay: 28, daysInMonth: 30 });
    expect(b.daysLeft).toBe(3);
    expect(b.perWeek).toBe(30_000);
    expect(b.perDay).toBe(10_000);
  });

  it("sem sobra (zero ou negativo), tudo zero e over = true", () => {
    for (const net of [0, -5_000]) {
      expect(weeklyBudget({ net, todayDay: 5, daysInMonth: 30 })).toMatchObject({
        perWeek: 0,
        perDay: 0,
        over: true,
      });
    }
  });

  it("nunca arredonda para cima além do disponível", () => {
    const b = weeklyBudget({ net: 100_000, todayDay: 1, daysInMonth: 31 });
    expect(b.perDay * b.daysLeft).toBeLessThanOrEqual(100_000);
  });

  it("dia fora do mês não gera dias negativos", () => {
    expect(weeklyBudget({ net: 1000, todayDay: 40, daysInMonth: 30 }).daysLeft).toBe(1);
  });
});
