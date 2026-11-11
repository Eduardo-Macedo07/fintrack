import type { Metadata } from "next";

import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // Cada página privada verifica a sessão por conta própria: layouts não
  // são re-renderizados a cada navegação, então não bastam como proteção.
  const user = await requireUser();

  return (
    <section className="grid gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Olá, {user.name.split(" ")[0]}!
      </h1>
      <p className="text-muted-foreground">
        Seu dashboard financeiro chega na próxima etapa.
      </p>
    </section>
  );
}
