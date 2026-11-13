/**
 * Telas da demonstração. Aqui só se COMPÕEM os componentes reais do app
 * (os mesmos de `src/app/**`), trocando a busca no servidor pelo estado do navegador.
 */
import { useMemo, useState } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import { MonthSwitcher } from "@/components/month-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToastProvider } from "@/components/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import { RegisterForm } from "@/features/auth/components/register-form";
import { weeklyBudget } from "@/features/dashboard/budget";
import { CategoryBars } from "@/features/dashboard/components/category-bars";
import { MonthHero } from "@/features/dashboard/components/month-hero";
import { PaceChart } from "@/features/dashboard/components/pace-chart";
import { cumulativeByDay } from "@/features/dashboard/cumulative";
import { DEMO_ACCOUNT } from "@/features/demo/demo-data";
import { SavingsPlanner } from "@/features/planning/components/savings-planner";
import { TransactionDialogProvider } from "@/features/transactions/components/transaction-dialog";
import { TransactionFilters } from "@/features/transactions/components/transaction-filters";
import { TransactionList } from "@/features/transactions/components/transaction-list";
import { transactionFiltersSchema } from "@/features/transactions/schemas";
import { currentMonth, daysInMonth, isMonthKey, today } from "@/lib/dates";

import {
  getDailyFlow,
  getMonthSummary,
  getRecentAverages,
  listCategories,
  listTransactions,
  type DemoUser,
} from "./data";
import Link from "./shims/next-link";
import { useSearchParams } from "./shims/next-navigation";
import { resetDemo, useDemoState } from "./store";

/** Estrutura das páginas privadas (equivale a `components/layout/app-shell.tsx`). */
export function Shell({ user, children }: { user: DemoUser; children: React.ReactNode }) {
  const state = useDemoState();
  const categories = useMemo(() => listCategories(state, user.id), [state, user.id]);

  return (
    <ToastProvider>
      <TransactionDialogProvider categories={categories}>
        <div className="flex min-h-full flex-1 flex-col">
          <TopBar userName={user.name} />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-32 sm:pt-8 sm:pb-16">
            <p className="mb-5 rounded-full bg-muted px-4 py-1.5 text-center text-xs text-muted-foreground">
              Demonstração: os dados são de exemplo e ficam só neste navegador.
            </p>
            {children}
          </main>
          <BottomNav />
        </div>
      </TransactionDialogProvider>
    </ToastProvider>
  );
}

export function DashboardPage({ user }: { user: DemoUser }) {
  const state = useDemoState();
  const raw = useSearchParams().get("month");
  const month = raw && isMonthKey(raw) ? raw : currentMonth();

  const { summary, daily, transactions } = useMemo(
    () => ({
      summary: getMonthSummary(state, user.id, month),
      daily: getDailyFlow(state, user.id, month),
      transactions: listTransactions(state, user.id, { month }),
    }),
    [state, user.id, month],
  );

  const todayDay = month === currentMonth() ? Number(today().slice(8, 10)) : null;
  const weekly =
    todayDay === null
      ? null
      : weeklyBudget({ net: summary.net, todayDay, daysInMonth: daysInMonth(month) });

  return (
    <div className="grid gap-12">
      <MonthHero
        month={month}
        income={summary.income}
        expense={summary.expense}
        balance={summary.balance}
        weekly={weekly}
      />

      <section aria-labelledby="categories-title">
        <h2
          id="categories-title"
          className="font-display mb-5 text-xl font-semibold tracking-tight"
        >
          Para onde foi o dinheiro
        </h2>
        <CategoryBars rows={summary.expensesByCategory} />
      </section>

      <section aria-labelledby="pace-title">
        <h2 id="pace-title" className="font-display text-xl font-semibold tracking-tight">
          Ritmo do mês
        </h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Quando a área vermelha passa da linha verde, você gastou mais do que entrou.
        </p>
        <PaceChart points={cumulativeByDay(month, daily)} todayDay={todayDay} />
      </section>

      <section aria-labelledby="recent-title">
        <div className="mb-3 flex items-baseline justify-between">
          <h2
            id="recent-title"
            className="font-display text-xl font-semibold tracking-tight"
          >
            Últimas transações
          </h2>
          {transactions.length > 5 && (
            <Link
              href={`/transactions?month=${month}`}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Ver todas
            </Link>
          )}
        </div>
        <TransactionList
          transactions={transactions.slice(0, 5)}
          emptyTitle="Nenhuma transação neste mês"
          emptyHint="Registre sua primeira despesa ou receita e o painel ganha vida."
        />
      </section>
    </div>
  );
}

export function TransactionsPage({ user }: { user: DemoUser }) {
  const state = useDemoState();
  const params = useSearchParams();
  const filters = transactionFiltersSchema.parse({
    month: params.get("month") ?? undefined,
    type: params.get("type") ?? undefined,
    categoryId: params.get("categoryId") ?? undefined,
    q: params.get("q") ?? undefined,
  });
  const { month, type, categoryId, q } = filters;

  const transactions = useMemo(
    () => listTransactions(state, user.id, { month, type, categoryId, q }),
    [state, user.id, month, type, categoryId, q],
  );
  const categories = useMemo(() => listCategories(state, user.id), [state, user.id]);
  const filtered = Boolean(type || categoryId || q);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Transações</h1>
        <MonthSwitcher month={month} />
      </div>

      <TransactionFilters categories={categories} />

      <TransactionList
        transactions={transactions}
        emptyTitle={filtered ? "Nada encontrado" : "Nenhuma transação neste mês"}
        emptyHint={
          filtered
            ? "Tente outra busca ou limpe os filtros."
            : "Registre uma despesa ou receita para começar."
        }
      />
    </div>
  );
}

export function PlanPage({ user }: { user: DemoUser }) {
  const state = useDemoState();
  const avg = useMemo(
    () => getRecentAverages(state, user.id, currentMonth()),
    [state, user.id],
  );

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

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-12">
      <ThemeToggle className="absolute top-4 right-4" />
      <div className="grid w-full max-w-sm gap-4">{children}</div>
    </main>
  );
}

export function LoginPage() {
  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Entrar no FinTrack</CardTitle>
          <CardDescription>Acesse suas finanças.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm
            defaults={{ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password }}
          />
          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link
              href="/register"
              className="text-primary underline-offset-4 hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
      <DemoNote>
        A conta de demonstração já está preenchida: toque em <strong>Entrar</strong>. Ela
        vem com 4 meses de movimentação de exemplo.
      </DemoNote>
    </AuthLayout>
  );
}

export function RegisterPage() {
  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Criar conta</CardTitle>
          <CardDescription>Comece a controlar suas finanças em minutos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RegisterForm />
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
      <DemoNote>
        A conta criada aqui existe só neste navegador. Invente uma senha: não use uma que
        você usa de verdade.
      </DemoNote>
    </AuthLayout>
  );
}

/** Aviso de que é uma demonstração, com a opção de recomeçar do zero. */
function DemoNote({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");

  return (
    <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
      <p>{children}</p>
      <p className="mt-2">
        Tudo fica guardado só neste aparelho.{" "}
        {step === "confirm" ? (
          <button
            type="button"
            className="font-medium text-destructive underline underline-offset-4"
            onClick={async () => {
              await resetDemo();
              setStep("done");
            }}
          >
            Confirmar: apagar os dados deste navegador
          </button>
        ) : (
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4"
            onClick={() => setStep("confirm")}
          >
            Recomeçar a demonstração
          </button>
        )}
        {step === "done" && <span role="status"> Dados de exemplo recriados.</span>}
      </p>
    </div>
  );
}
