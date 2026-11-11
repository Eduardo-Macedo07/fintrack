import type { NextAuthConfig } from "next-auth";

/** Rotas acessíveis sem login. Todo o resto exige sessão. */
const PUBLIC_PATHS = ["/", "/login", "/register"];
const AUTH_PAGES = ["/login", "/register"];

/**
 * Parte da configuração do Auth.js que NÃO depende de banco nem de bcrypt.
 * É usada pelo `proxy.ts` para checagens otimistas e reaproveitada em `auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7 dias
  providers: [], // o provider de credenciais é adicionado em auth.ts
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const loggedIn = Boolean(auth?.user);

      // Quem já está logado não precisa ver login/cadastro.
      if (loggedIn && AUTH_PAGES.includes(pathname)) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      return PUBLIC_PATHS.includes(pathname) || loggedIn;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
