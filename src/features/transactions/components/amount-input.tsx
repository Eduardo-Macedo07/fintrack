"use client";

import { nextCents, parsePasted } from "../amount-mask";
import { cn } from "@/lib/utils";

/**
 * Campo de valor estilo "caixa registradora": o usuário digita só números
 * e os centavos se ajustam sozinhos (1 → 0,01 · 1990 → 19,90).
 * O valor real (inteiro em centavos) segue num campo oculto chamado `name`.
 */
export function AmountInput({
  name,
  cents,
  onChange,
  tone,
  error,
}: {
  name: string;
  cents: number;
  onChange: (cents: number) => void;
  tone: "income" | "expense";
  error?: string;
}) {
  const display = (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={`${name}-visible`}
        className="flex items-baseline justify-center gap-2 rounded-2xl bg-muted/60 px-4 py-5 focus-within:ring-[3px] focus-within:ring-ring/40"
      >
        <span className="font-display text-xl font-medium text-muted-foreground">R$</span>
        <input
          id={`${name}-visible`}
          inputMode="numeric"
          autoComplete="off"
          value={display}
          aria-label="Valor em reais"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          onChange={(e) => onChange(nextCents(cents, e.target.value))}
          onPaste={(e) => {
            // Colar vira valor em reais (R$ 12,34), não "dígitos soltos" no meio do campo.
            e.preventDefault();
            const pasted = parsePasted(e.clipboardData.getData("text"));
            if (pasted !== null) onChange(pasted);
          }}
          className={cn(
            "font-display tabular w-full min-w-0 bg-transparent text-center text-5xl font-semibold tracking-tight outline-none",
            tone === "income" ? "text-income" : "text-foreground",
          )}
        />
      </label>
      <input type="hidden" name={name} value={cents} />
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="text-center text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
