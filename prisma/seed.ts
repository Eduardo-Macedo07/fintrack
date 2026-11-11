/**
 * Cria (ou recria) uma conta de DEMONSTRAÇÃO com 4 meses de movimentação,
 * para ver o app cheio sem digitar nada.   npm run db:seed
 *
 * Só roda em banco LOCAL: uma conta com senha pública num banco real seria uma falha de segurança.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { registerUser } from "@/features/auth/server/register";
import {
  createTransaction,
  listCategories,
} from "@/features/transactions/server/service";
import { PrismaClient } from "@/generated/prisma/client";
import { currentMonth, daysInMonth, shiftMonth, today } from "@/lib/dates";

config({ path: ".env.local" });
config();

export const DEMO = { name: "Demo", email: "demo@fintrack.dev", password: "demo12345" };

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

function assertLocalDatabase(url: string | undefined) {
  if (!url) throw new Error("DATABASE_URL não definida. Rode `npm run setup` primeiro.");
  if (process.env.NODE_ENV === "production") {
    throw new Error("Recusado: o seed não roda com NODE_ENV=production.");
  }
  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error(
      `Recusado: o seed só roda em banco local (host atual: ${host}).\n` +
        "Ele cria uma conta com senha pública.",
    );
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  assertLocalDatabase(url);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    await prisma.user.deleteMany({ where: { email: DEMO.email } }); // recria do zero (cascata)
    const user = await registerUser(prisma, DEMO);
    const categories = await listCategories(prisma, user.id);
    const categoryId = (name: string) => categories.find((c) => c.name === name)?.id;

    const now = currentMonth();
    const todayDay = Number(today().slice(8, 10));
    let count = 0;

    for (let i = 0; i < VARIATION.length; i++) {
      const month = shiftMonth(now, i - (VARIATION.length - 1));
      const isCurrent = month === now;
      for (const entry of ENTRIES) {
        if (entry.everyOther && i % 2 === 1) continue;
        const day = Math.min(entry.day, daysInMonth(month));
        if (isCurrent && day > todayDay) continue; // sem lançamentos no futuro
        const cents = entry.varies
          ? Math.round((entry.cents * VARIATION[i]) / 100) * 100
          : entry.cents;
        await createTransaction(prisma, user.id, {
          type: entry.type,
          amount: cents,
          description: entry.description,
          date: `${month}-${String(day).padStart(2, "0")}`,
          categoryId: categoryId(entry.category),
        });
        count++;
      }
    }

    console.log(`Conta de demonstração criada com ${count} transações.`);
    console.log(`  e-mail: ${DEMO.email}`);
    console.log(`  senha:  ${DEMO.password}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
