import type { Metadata } from "next";
import { Suspense } from "react";

import { SavingsPlanner } from "@/features/planning/components/savings-planner";
import { getRecentAverages } from "@/features/transactions/server/service";
import { currentMonth } from "@/lib/dates";
import { PageSkeleton } from "@/components/layout/skeletons";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Planejar" };

async function PlanContent() {
  const user = await requireUser();
  const avg = await getRecentAverages(prisma, user.id, currentMonth());

  return (
    <div className="grid gap-10">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Planejar</h1>
        <p className="mt-1 text-muted-foreground">
          Veja quanto dá para guardar e o que isso vira com o tempo.
        </p>
      </header>
      <SavingsPlanner avg={avg} />
    </div>
  );
}

/** Página síncrona: o conteúdo que lê sessão/banco fica no <Suspense> desta página (ver dashboard/page.tsx). */
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PlanContent />
    </Suspense>
  );
}
