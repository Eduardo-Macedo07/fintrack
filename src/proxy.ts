import NextAuth from "next-auth";

import { authConfig } from "@/server/auth.config";

/**
 * Checagem OTIMISTA: redireciona para /login quem não tem sessão.
 * Não é a segurança real. A autorização de verdade acontece em `requireUser()`
 * e em toda query (sempre filtrando por userId).
 */
export default NextAuth(authConfig).auth;

export const config = {
  // Ignora API, arquivos estáticos e internos do Next.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
