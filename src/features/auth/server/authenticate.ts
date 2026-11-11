import type { Db } from "@/server/db";

import { loginSchema } from "../schemas";
import { DUMMY_HASH, verifyPassword } from "./password";

/**
 * Valida e-mail e senha. Retorna o usuário ou `null`: nunca diferencia
 * "e-mail inexistente" de "senha errada" para quem chamou.
 */
export async function authenticate(db: Db, credentials: unknown) {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return null;

  return { id: user.id, name: user.name, email: user.email };
}
