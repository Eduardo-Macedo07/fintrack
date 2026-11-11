import { DEFAULT_CATEGORIES } from "@/features/categories/default-categories";
import { Prisma } from "@/generated/prisma/client";
import type { Db } from "@/server/db";

import { registerSchema } from "../schemas";
import { hashPassword } from "./password";

export class EmailTakenError extends Error {
  constructor() {
    super("Já existe uma conta com este e-mail");
    this.name = "EmailTakenError";
  }
}

/**
 * Cria o usuário, a conta inicial "Carteira" e as categorias padrão numa única
 * transação: ou tudo é criado, ou nada.
 *
 * Recebe o cliente do banco por parâmetro para poder ser testada.
 */
export async function registerUser(db: Db, input: unknown) {
  const { name, email, password } = registerSchema.parse(input);
  const passwordHash = await hashPassword(password);

  try {
    return await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        accounts: { create: { name: "Carteira", type: "WALLET" } },
        categories: { createMany: { data: [...DEFAULT_CATEGORIES] } },
      },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    // Cobre a corrida entre duas requisições com o mesmo e-mail:
    // a constraint única do banco é a garantia final.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new EmailTakenError();
    }
    throw error;
  }
}
