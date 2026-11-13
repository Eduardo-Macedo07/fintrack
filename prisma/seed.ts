/**
 * Cria (ou recria) uma conta de DEMONSTRAÇÃO com 4 meses de movimentação,
 * para ver o app cheio sem digitar nada.   npm run db:seed
 *
 * Só roda em banco LOCAL: uma conta com senha pública num banco real seria uma falha de segurança.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { registerUser } from "@/features/auth/server/register";
import { buildDemoTransactions, DEMO_ACCOUNT as DEMO } from "@/features/demo/demo-data";
import {
  createTransaction,
  listCategories,
} from "@/features/transactions/server/service";
import { PrismaClient } from "@/generated/prisma/client";
import { currentMonth, today } from "@/lib/dates";

config({ path: ".env.local" });
config();

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

    const transactions = buildDemoTransactions(
      currentMonth(),
      Number(today().slice(8, 10)),
    );
    for (const t of transactions) {
      await createTransaction(prisma, user.id, {
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date,
        categoryId: categoryId(t.category),
      });
    }
    const count = transactions.length;

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
