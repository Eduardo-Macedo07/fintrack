import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 px-6 py-24">
      <span className="text-sm font-medium tracking-wide text-primary uppercase">
        FinTrack
      </span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Suas finanças, sob controle.
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Receitas, despesas, cartões, parcelas e metas em um só lugar. Em construção.
      </p>
      <Button size="lg" disabled>
        Entrar (em breve)
      </Button>
    </main>
  );
}
