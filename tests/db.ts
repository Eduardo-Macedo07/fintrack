import { prisma } from "@/server/db";

/** Esvazia as tabelas entre testes. CASCADE a partir de User limpa todo o resto. */
export async function resetDb() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
}

export { prisma };
