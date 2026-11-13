import { describe, expect, it } from "vitest";

import { DEFAULT_CATEGORIES } from "@/features/categories/default-categories";

import { buildDemoTransactions } from "./demo-data";

describe("buildDemoTransactions", () => {
  const txs = buildDemoTransactions("2026-11", 11);

  it("gera 4 meses terminando no mês atual", () => {
    const months = [...new Set(txs.map((t) => t.date.slice(0, 7)))].sort();
    expect(months).toEqual(["2026-08", "2026-09", "2026-10", "2026-11"]);
  });

  it("não cria lançamentos no futuro", () => {
    const current = txs.filter((t) => t.date.startsWith("2026-11"));
    expect(current.every((t) => Number(t.date.slice(8)) <= 11)).toBe(true);
    expect(current.length).toBeGreaterThan(0);
  });

  it("é determinística (mesma quantidade do seed original: 53 no dia 11/11)", () => {
    expect(txs).toHaveLength(53);
    expect(buildDemoTransactions("2026-11", 11)).toEqual(txs);
  });

  it("só usa categorias padrão, do tipo certo, e valores positivos", () => {
    for (const t of txs) {
      const category = DEFAULT_CATEGORIES.find((c) => c.name === t.category);
      expect(category?.type).toBe(t.type);
      expect(Number.isInteger(t.amount) && t.amount > 0).toBe(true);
    }
  });

  it("ajusta o dia em meses curtos (dia 30 em fevereiro vira 28)", () => {
    const feb = buildDemoTransactions("2027-02", 28).filter((t) =>
      t.date.startsWith("2027-02"),
    );
    expect(feb.every((t) => Number(t.date.slice(8)) <= 28)).toBe(true);
  });
});
