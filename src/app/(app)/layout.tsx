import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ShellSkeleton } from "@/components/layout/skeletons";

/**
 * A sessão é lida em tempo de requisição, então fica atrás de <Suspense>
 * (exigência do Cache Components): o esqueleto aparece na hora e o conteúdo chega por streaming.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
