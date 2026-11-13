import { describe, expect, it } from "vitest";

import { formatAmount, nextCents, parsePasted } from "./amount-mask";

const show = formatAmount;

/** Simula o usuário digitando `char` com o cursor na posição `pos` do texto mostrado. */
const typeAt = (cents: number, pos: number, char: string) => {
  const text = show(cents);
  return nextCents(cents, text.slice(0, pos) + char + text.slice(pos));
};

/** Simula Backspace/Delete removendo o caractere em `pos`. */
const deleteAt = (cents: number, pos: number) => {
  const text = show(cents);
  return nextCents(cents, text.slice(0, pos) + text.slice(pos + 1));
};

describe("nextCents: digitar", () => {
  it("digitar 3590 dá R$ 35,90", () => {
    let cents = 0;
    for (const ch of "3590") cents = typeAt(cents, show(cents).length, ch);
    expect(cents).toBe(3590);
  });

  it("o cursor no MEIO não muda o resultado (o defeito que tornava 3590 em 3.005,90)", () => {
    // Em cada passo, o cursor é posto em qualquer lugar do texto exibido.
    for (let pos = 0; pos <= 4; pos++) {
      let cents = 0;
      for (const ch of "3590")
        cents = typeAt(cents, Math.min(pos, show(cents).length), ch);
      expect(cents).toBe(3590);
    }
  });

  it("para qualquer posição do cursor, o dígito entra no fim", () => {
    for (const start of [0, 5, 359, 3590, 123456]) {
      const text = show(start);
      for (let pos = 0; pos <= text.length; pos++) {
        expect(typeAt(start, pos, "7")).toBe(start * 10 + 7);
      }
    }
  });

  it("digitar zero a partir de zero continua zero", () => {
    expect(typeAt(0, 0, "0")).toBe(0);
    expect(typeAt(0, 4, "0")).toBe(0);
  });

  it("respeita o limite máximo", () => {
    expect(typeAt(999_999_999, 11, "9")).toBe(1_000_000_000);
  });
});

describe("nextCents: apagar", () => {
  it("apagar em QUALQUER posição remove o último dígito, inclusive sobre a vírgula ou o ponto", () => {
    for (const start of [359, 3590, 123456, 100000000]) {
      const text = show(start);
      for (let pos = 0; pos < text.length; pos++) {
        expect(deleteAt(start, pos)).toBe(Math.floor(start / 10));
      }
    }
  });

  it("Backspace logo depois da vírgula (cursor no meio de 35,90) apaga um dígito", () => {
    expect(nextCents(3590, "3590")).toBe(359); // "35,90" sem a vírgula
  });

  it("apagar até o fim volta a zero", () => {
    let cents = 123;
    for (let i = 0; i < 5; i++) cents = nextCents(cents, show(cents).slice(0, -1));
    expect(cents).toBe(0);
  });
});

describe("nextCents: substituir e ignorar", () => {
  it("selecionar tudo e digitar começa um valor novo", () => {
    expect(nextCents(3590, "7")).toBe(7);
  });

  it("texto vazio é zero", () => {
    expect(nextCents(3590, "")).toBe(0);
  });

  it("preencher o campo inteiro de uma vez vale o texto todo (não é confundido com digitar)", () => {
    expect(nextCents(0, "3590")).toBe(3590);
    expect(nextCents(0, "1000")).toBe(1000);
    expect(nextCents(3597, "3590")).toBe(3590);
    expect(nextCents(6000, "7500")).toBe(7500);
  });

  it("digitar algo que não é número não muda o valor", () => {
    for (const ch of ["a", ",", ".", " ", "-"]) {
      expect(typeAt(3590, 2, ch)).toBe(3590);
      expect(typeAt(0, 4, ch)).toBe(0);
    }
  });
});

describe("parsePasted", () => {
  it("interpreta valores no formato brasileiro como reais", () => {
    expect(parsePasted("R$ 12,34")).toBe(1234);
    expect(parsePasted("1.234,56")).toBe(123456);
    expect(parsePasted("12")).toBe(1200);
    expect(parsePasted("  7,5 ")).toBe(750);
  });

  it("ignora o que não é valor válido", () => {
    expect(parsePasted("abc")).toBeNull();
    expect(parsePasted("")).toBeNull();
    expect(parsePasted("1,234")).toBeNull();
    expect(parsePasted("-5,00")).toBeNull();
  });

  it("respeita o limite máximo", () => {
    expect(parsePasted("99.999.999.999,00")).toBe(1_000_000_000);
  });
});
