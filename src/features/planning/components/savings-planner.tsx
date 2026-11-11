"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { AnimatedMoney } from "@/components/animated-money";
import { Segmented } from "@/components/segmented";
import { AmountInput } from "@/features/transactions/components/amount-input";
import { formatBRL } from "@/lib/money";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

import type { MonthlyAverages } from "../averages";
import { DEBT_FIRST, DISCLAIMER, LEARN_STEPS, REFERENCE } from "../learn";
import {
  formatDuration,
  inTodaysMoney,
  monthsToTarget,
  projectSavings,
} from "../projection";
import { ProjectionChart } from "./projection-chart";

type Averages = MonthlyAverages & { partial: boolean };
type Years = "1" | "3" | "5" | "10";

/** Hipóteses de rendimento ao ano. São cenários para testar, não promessas de nenhum produto. */
const RATE_PRESETS = [6, 11, 14] as const;
const DEFAULT_RATE = "11";

function parseRate(text: string): number | null {
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

export function SavingsPlanner({ avg }: { avg: Averages }) {
  const initialMonthly = avg.net > 0 ? Math.round(avg.net / 1000) * 1000 : 0;
  const [monthly, setMonthly] = useState(initialMonthly);
  const [years, setYears] = useState<Years>("5");
  const [rateText, setRateText] = useState(DEFAULT_RATE);

  const rate = parseRate(rateText);
  const months = Number(years) * 12;

  const projection = useMemo(
    () => projectSavings({ monthly, annualRatePct: rate ?? 0, months }),
    [monthly, rate, months],
  );
  const todaysMoney = inTodaysMoney(projection.total, REFERENCE.inflationPct, months);

  const reserve6 = avg.expense * 6;
  const reserve3 = avg.expense * 3;
  const reserveMonths = useMemo(
    () =>
      reserve6 > 0
        ? monthsToTarget({ target: reserve6, monthly, annualRatePct: rate ?? 0 })
        : 0,
    [reserve6, monthly, rate],
  );

  const period = avg.partial
    ? "Neste mês, até agora,"
    : avg.months === 1
      ? "No último mês,"
      : `Nos últimos ${avg.months} meses,`;

  return (
    <div className="grid gap-14">
      {/* 1. Quanto dá para guardar */}
      <section aria-labelledby="save-title" className="grid gap-5">
        <div>
          <h2
            id="save-title"
            className="font-display text-xl font-semibold tracking-tight"
          >
            Quanto você consegue guardar
          </h2>
          <p className="mt-1 text-muted-foreground">
            {avg.months === 0
              ? "Registre algumas transações e eu sugiro um valor com base no seu histórico. Enquanto isso, teste um valor abaixo."
              : avg.net > 0
                ? `${period} sobraram em média ${formatBRL(avg.net)} por mês.`
                : `${period} você gastou em média ${formatBRL(-avg.net)} a mais do que entrou. Antes de guardar, vale olhar para onde o dinheiro está indo.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {avg.net > 0 && (
            <QuickChip
              label={`O que sobra (${formatBRL(avg.net)})`}
              active={monthly === avg.net}
              onClick={() => setMonthly(avg.net)}
            />
          )}
          {avg.income > 0 &&
            [10, 20].map((pct) => {
              const value = Math.round((avg.income * pct) / 100);
              return (
                <QuickChip
                  key={pct}
                  label={`${pct}% da renda (${formatBRL(value)})`}
                  active={monthly === value}
                  onClick={() => setMonthly(value)}
                />
              );
            })}
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-medium">Guardar por mês</p>
          <AmountInput
            name="monthly"
            cents={monthly}
            onChange={setMonthly}
            tone="expense"
          />
        </div>
      </section>

      {/* 2. Quanto isso vira */}
      <section aria-labelledby="result-title" className="grid gap-6">
        <div>
          <h2
            id="result-title"
            className="font-display text-xl font-semibold tracking-tight"
          >
            Quanto isso vira
          </h2>
          <p className="mt-1 text-muted-foreground">
            Juros compostos: o rendimento também rende. Mude o prazo e a taxa para testar
            cenários.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <p className="text-sm font-medium">Por quanto tempo</p>
            <Segmented<Years>
              label="Prazo"
              value={years}
              onChange={setYears}
              className="w-full"
              options={[
                { value: "1", label: "1 ano" },
                { value: "3", label: "3 anos" },
                { value: "5", label: "5 anos" },
                { value: "10", label: "10 anos" },
              ]}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="rate" className="text-sm font-medium">
              Rendimento por ano (hipótese)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative w-28">
                <input
                  id="rate"
                  inputMode="decimal"
                  value={rateText}
                  onChange={(e) => setRateText(e.target.value)}
                  aria-invalid={rate === null ? true : undefined}
                  className="h-10 w-full rounded-xl border bg-card pr-8 pl-3 text-right text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
              {RATE_PRESETS.map((preset) => (
                <QuickChip
                  key={preset}
                  label={`${preset}%`}
                  active={rate === preset}
                  onClick={() => setRateText(String(preset))}
                />
              ))}
            </div>
            {rate === null && (
              <p role="alert" className="text-sm text-destructive">
                Informe uma taxa entre 0 e 100.
              </p>
            )}
          </div>
        </div>

        <motion.div
          key={`${years}-${rate}`}
          initial={{ opacity: 0.6, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="rounded-[32px] bg-hero px-6 py-7 text-hero-foreground sm:px-9 sm:py-9"
          aria-live="polite"
        >
          <p className="text-hero-foreground/80">
            Em {years === "1" ? "1 ano" : `${years} anos`} você teria
          </p>
          <div className="font-display tabular text-[2.75rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl">
            <AnimatedMoney cents={projection.total} />
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
            <div>
              <dt className="text-sm text-hero-foreground/75">Você guarda</dt>
              <dd className="font-display tabular text-lg font-semibold">
                <AnimatedMoney cents={projection.contributed} duration={0.8} />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-hero-foreground/75">Rende</dt>
              <dd className="font-display tabular text-lg font-semibold">
                <AnimatedMoney cents={projection.interest} duration={0.8} />
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-hero-foreground/80">
            Em dinheiro de hoje, descontando uma inflação de {REFERENCE.inflationPct}% ao
            ano, isso compra o equivalente a{" "}
            <strong className="font-semibold">{formatBRL(todaysMoney)}</strong>.
          </p>
        </motion.div>

        <ProjectionChart points={projection.points} />

        <p className="text-sm text-muted-foreground">
          Referência: a Selic estava em {REFERENCE.selicPct.toString().replace(".", ",")}%
          ao ano em {REFERENCE.asOf}. Investimentos de renda fixa costumam render perto
          dela, antes de imposto. As taxas mudam:{" "}
          <a
            href={REFERENCE.source}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            confira a atual no Banco Central
          </a>
          . Valores sem desconto de imposto.
        </p>
      </section>

      {/* 3. Reserva de emergência */}
      <section aria-labelledby="reserve-title" className="grid gap-3">
        <h2
          id="reserve-title"
          className="font-display text-xl font-semibold tracking-tight"
        >
          Sua reserva de emergência
        </h2>
        {avg.expense > 0 ? (
          <>
            <p className="text-muted-foreground">
              Com gasto médio de {formatBRL(avg.expense)} por mês, a reserva fica entre{" "}
              <strong className="font-semibold text-foreground">
                {formatBRL(reserve3)}
              </strong>{" "}
              (3 meses) e{" "}
              <strong className="font-semibold text-foreground">
                {formatBRL(reserve6)}
              </strong>{" "}
              (6 meses).
            </p>
            <p className="font-medium">
              {monthly === 0
                ? "Defina quanto guardar por mês para ver em quanto tempo você chega lá."
                : reserveMonths === null
                  ? "Nesse ritmo, a reserva completa (6 meses de gastos) levaria mais de 50 anos."
                  : `Guardando ${formatBRL(monthly)} por mês, a reserva completa (6 meses de gastos) fica pronta em ${formatDuration(reserveMonths)}.`}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            Registre suas despesas para eu calcular quanto seria a sua reserva de
            emergência.
          </p>
        )}
      </section>

      {/* 4. Para onde o dinheiro pode ir */}
      <section aria-labelledby="learn-title" className="grid gap-5">
        <div>
          <h2
            id="learn-title"
            className="font-display text-xl font-semibold tracking-tight"
          >
            Para onde esse dinheiro pode ir
          </h2>
          <p className="mt-1 text-muted-foreground">
            Uma ordem de prioridade que costuma fazer sentido. Aqui explico os tipos de
            investimento, sem indicar produtos.
          </p>
        </div>

        <div className="rounded-2xl bg-muted/70 p-4">
          <p className="font-medium">{DEBT_FIRST.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{DEBT_FIRST.text}</p>
        </div>

        <ol className="grid gap-4">
          {LEARN_STEPS.map((step) => (
            <li key={step.id} className="rounded-2xl border bg-card p-5">
              <h3 className="font-display text-lg font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm">{step.when}</p>
              <p className="mt-2 text-sm text-muted-foreground">{step.where}</p>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Risco:</dt>
                  <dd className="font-medium">{step.risk}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Acesso:</dt>
                  <dd className="font-medium">{step.access}</dd>
                </div>
              </dl>
              {step.id === "reserve" && avg.expense > 0 && (
                <p className="mt-3 text-sm font-medium text-primary">
                  Seu alvo: {formatBRL(reserve6)} (6 meses do que você gasta).
                </p>
              )}
              {step.note && (
                <p className="mt-3 text-sm text-muted-foreground">{step.note}</p>
              )}
            </li>
          ))}
        </ol>

        <p role="note" className="text-sm text-muted-foreground">
          {DISCLAIMER}
        </p>
      </section>
    </div>
  );
}

function QuickChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-border",
      )}
    >
      {label}
    </motion.button>
  );
}
