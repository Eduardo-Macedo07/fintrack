function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted ${className}`} />;
}

/** Mostrado enquanto a página carrega: já desenha o formato do painel e da lista. */
export function PageSkeleton() {
  return (
    <div className="grid gap-10" aria-busy="true" aria-label="Carregando">
      <Bone className="h-72 rounded-[32px]" />
      <div className="grid gap-4">
        <Bone className="h-5 w-48" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <Bone className="h-4 w-2/3" />
      </div>
      <div className="grid gap-3">
        <Bone className="h-14" />
        <Bone className="h-14" />
        <Bone className="h-14" />
      </div>
    </div>
  );
}

export function ShellSkeleton() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="h-16 border-b" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <PageSkeleton />
      </main>
    </div>
  );
}
