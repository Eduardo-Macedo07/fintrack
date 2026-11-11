import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db";

/**
 * Usuário da sessão atual, confirmado no banco.
 *
 * Consultar o banco (e não só confiar no JWT) garante que um usuário excluído
 * perde o acesso imediatamente. `cache` evita repetir a consulta na mesma requisição.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  });
});

/** Use em toda página/Server Action privada. Sem sessão válida, redireciona ao login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
