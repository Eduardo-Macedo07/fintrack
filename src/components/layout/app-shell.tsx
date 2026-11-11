import { Suspense } from "react";

import { ToastProvider } from "@/components/toast";
import { TransactionDialogProvider } from "@/features/transactions/components/transaction-dialog";
import { listCategories } from "@/features/transactions/server/service";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";

import { BottomNav } from "./bottom-nav";
import { PageSkeleton } from "./skeletons";
import { TopBar } from "./top-bar";

/** Estrutura das páginas privadas: confirma a sessão, carrega as categorias e monta navegação + diálogo. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const categories = await listCategories(prisma, user.id);

  return (
    <ToastProvider>
      <TransactionDialogProvider categories={categories}>
        <div className="flex min-h-full flex-1 flex-col">
          <TopBar userName={user.name} />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-32 sm:pt-8 sm:pb-16">
            <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
          </main>
          <BottomNav />
        </div>
      </TransactionDialogProvider>
    </ToastProvider>
  );
}
