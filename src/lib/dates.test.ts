import { describe, expect, it } from "vitest";

import {
  currentMonth,
  formatDay,
  formatDayLabel,
  formatMonthLabel,
  isMonthKey,
  monthRange,
  parseDay,
  shiftMonth,
  today,
} from "./dates";

describe("parseDay / formatDay", () => {
  it("vai e volta sem deslocar o dia (meia-noite UTC)", () => {
    const d = parseDay("2026-10-31");
    expect(d.toISOString()).toBe("2026-10-31T00:00:00.000Z");
    expect(formatDay(d)).toBe("2026-10-31");
  });

  it("rejeita datas inexistentes e formatos errados", () => {
    expect(() => parseDay("2026-02-31")).toThrow(RangeError);
    expect(() => parseDay("2026-13-01")).toThrow(RangeError);
    expect(() => parseDay("31/10/2026")).toThrow(RangeError);
  });

  it("aceita 29/02 só em ano bissexto", () => {
    expect(formatDay(parseDay("2028-02-29"))).toBe("2028-02-29");
    expect(() => parseDay("2027-02-29")).toThrow(RangeError);
  });
});

describe("monthRange", () => {
  it("é [início, fim) e o fim é o dia 1 do mês seguinte", () => {
    const { start, end } = monthRange("2026-02");
    expect(formatDay(start)).toBe("2026-02-01");
    expect(formatDay(end)).toBe("2026-03-01");
  });

  it("vira o ano em dezembro", () => {
    expect(formatDay(monthRange("2026-12").end)).toBe("2027-01-01");
  });

  it("rejeita mês inválido", () => {
    expect(() => monthRange("2026-13")).toThrow(RangeError);
    expect(isMonthKey("2026-1")).toBe(false);
    expect(isMonthKey("2026-11")).toBe(true);
  });
});

describe("shiftMonth", () => {
  it("avança e volta cruzando anos", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-11", 0)).toBe("2026-11");
    expect(shiftMonth("2026-11", -14)).toBe("2025-09");
  });
});

describe("hoje no fuso do app", () => {
  it("23h30 de 31/10 em São Paulo ainda é outubro (já é 1º/11 em UTC)", () => {
    const now = new Date("2026-11-01T02:30:00Z"); // 23:30 em UTC-3
    expect(today(now)).toBe("2026-10-31");
    expect(currentMonth(now)).toBe("2026-10");
  });

  it("rotula Hoje, Ontem e datas antigas", () => {
    const now = new Date("2026-11-11T15:00:00Z");
    expect(formatDayLabel("2026-11-11", now)).toBe("Hoje");
    expect(formatDayLabel("2026-11-10", now)).toBe("Ontem");
    expect(formatDayLabel("2026-11-05", now)).toMatch(/5/);
  });

  it("formata o rótulo do mês em português", () => {
    expect(formatMonthLabel("2026-11")).toBe("novembro de 2026");
  });
});
