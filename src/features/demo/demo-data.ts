import { daysInMonth, shiftMonth, type MonthKey } from "@/lib/dates";

/** Conta de demonstração. A senha é pública de propósito: só existe em banco local e na versão de demonstração. */
export const DEMO_ACCOUNT = {
  name: "Demo",
  email: "demo@fintrack.dev",
  password: "demo12345",
};

type Entry = {
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  cents: number;
  day: number;
  /** Varia de mês a mês, para o gráfico não ficar artificial. */
  varies?: boolean;
  /** Só em meses alternados. */
  everyOther?: boolean;
};

const ENTRIES: Entry[] = [
  { type: "INCOME", category: "Salário", description: "Salário", cents: 650000, day: 5 },
  {
    type: "INCOME",
    category: "Freelance",
    description: "Projeto freelance",
    cents: 110000,
    day: 18,
    everyOther: true,
  },
  {
    type: "INCOME",
    category: "Investimentos",
    description: "Rendimentos",
    cents: 4500,
    day: 20,
  },
  {
    type: "EXPENSE",
    category: "Moradia",
    description: "Aluguel",
    cents: 185000,
    day: 10,
  },
  {
    type: "EXPENSE",
    category: "Moradia",
    description: "Condomínio",
    cents: 42000,
    day: 10,
  },
  {
    type: "EXPENSE",
    category: "Alimentação",
    description: "Mercado",
    cents: 38500,
    day: 3,
    varies: true,
  },
  {
    type: "EXPENSE",
    category: "Alimentação",
    description: "Mercado",
    cents: 27200,
    day: 12,
    varies: true,
  },
  {
    type: "EXPENSE",
    category: "Alimentação",
    description: "Mercado",
    cents: 31800,
    day: 21,
    varies: true,
  },
  {
    type: "EXPENSE",
    category: "Alimentação",
    description: "Restaurante",
    cents: 7800,
    day: 15,
    varies: true,
  },
  {
    type: "EXPENSE",
    category: "Transporte",
    description: "Combustível",
    cents: 25000,
    day: 8,
    varies: true,
  },
  {
    type: "EXPENSE",
    category: "Transporte",
    description: "Uber",
    cents: 3200,
    day: 19,
    varies: true,
  },
  { type: "EXPENSE", category: "Lazer", description: "Streaming", cents: 5590, day: 6 },
  {
    type: "EXPENSE",
    category: "Lazer",
    description: "Cinema",
    cents: 8900,
    day: 22,
    varies: true,
  },
  {
    type: "EXPENSE",
    category: "Saúde",
    description: "Farmácia",
    cents: 6740,
    day: 14,
    varies: true,
  },
  {
    type: "EXPENSE",
    category: "Educação",
    description: "Curso online",
    cents: 14900,
    day: 9,
  },
  {
    type: "EXPENSE",
    category: "Outras despesas",
    description: "Presente",
    cents: 12000,
    day: 26,
    everyOther: true,
  },
];

/** Multiplicador fixo por mês (do mais antigo ao atual): resultado igual a cada execução. */
const VARIATION = [1.0, 0.92, 1.08, 1.0];

export type DemoTransaction = {
  type: "INCOME" | "EXPENSE";
  /** Nome de uma das categorias padrão. */
  category: string;
  description: string;
  amount: number; // centavos
  date: string; // YYYY-MM-DD
};

/**
 * Quatro meses de movimentação terminando em `currentMonth`, sem lançamentos depois de `todayDay`.
 * Função pura: mesmos argumentos, mesmo resultado.
 */
export function buildDemoTransactions(
  currentMonth: MonthKey,
  todayDay: number,
): DemoTransaction[] {
  const result: DemoTransaction[] = [];
  for (let i = 0; i < VARIATION.length; i++) {
    const month = shiftMonth(currentMonth, i - (VARIATION.length - 1));
    const isCurrent = month === currentMonth;
    for (const entry of ENTRIES) {
      if (entry.everyOther && i % 2 === 1) continue;
      const day = Math.min(entry.day, daysInMonth(month));
      if (isCurrent && day > todayDay) continue;
      result.push({
        type: entry.type,
        category: entry.category,
        description: entry.description,
        amount: entry.varies
          ? Math.round((entry.cents * VARIATION[i]) / 100) * 100
          : entry.cents,
        date: `${month}-${String(day).padStart(2, "0")}`,
      });
    }
  }
  return result;
}
