import Link from "next/link";
import { Suspense } from "react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { requireUser } from "@/server/session";

/**
 * A sessão é lida em tempo de requisição, então fica atrás de <Suspense>
 * (exigência do Cache Components). O cabeçalho estático aparece na hora.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            FinTrack
          </Link>
          <Suspense
            fallback={<div className="h-8 w-32 animate-pulse rounded-md bg-muted" />}
          >
            <UserMenu />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

async function UserMenu() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{user.name}</span>
      <LogoutButton />
    </div>
  );
}
