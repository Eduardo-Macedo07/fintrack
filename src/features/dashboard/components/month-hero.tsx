"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

import { AnimatedMoney } from "@/components/animated-money";
import { MonthSwitcher } from "@/components/month-switcher";
import { formatBRL } from "@/lib/money";
import { easeOut } from "@/lib/motion";

type Props = {
  month: string;
  income: number;
  expense: number;
  /** Saldo acumulado até o fim do mês. */
  balance: number;
};

/**
 * O destaque da tela: responde "quanto ainda posso gastar neste mês?".
 * Ao abrir, toca uma única sequência: rótulo → valor contando → barra enchendo → detalhes.
 */
export function MonthHero({ month, income, expense, balance }: Props) {
  const reduce = useReducedMotion();
  const net = income - expense;
  const over = net < 0;
  const empty = income === 0 && expense === 0;

  // Quanto do que entrou já foi gasto (limitado a 100% na barra).
  const ratio = income > 0 ? expense / income : expense > 0 ? 1 : 0;
  const fill = Math.min(ratio, 1);

  const headline = empty ? "Nada registrado" : over ? "Faltam" : "Sobram";
  const caption = empty
    ? "Registre uma transação para ver como o mês está indo."
    : income === 0
      ? "Você ainda não registrou nenhuma receita neste mês."
      : over
        ? `Você gastou ${formatBRL(expense - income)} a mais do que entrou.`
        : `Você gastou ${Math.round(ratio * 100)}% do que entrou.`;

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
  };

  return (
    <motion.section
      aria-label="Resumo do mês"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      className="relative overflow-hidden rounded-[32px] bg-hero px-6 pt-5 pb-7 text-hero-foreground sm:px-9 sm:pt-6 sm:pb-9"
    >
      <motion.div
        variants={item}
        className="-mx-2 mb-8 flex justify-center sm:mb-10 sm:justify-start"
      >
        <MonthSwitcher month={month} tone="onHero" />
      </motion.div>

      <motion.p variants={item} className="text-base text-hero-foreground/80">
        {headline}
      </motion.p>

      <motion.div
        variants={item}
        className="font-display tabular text-[2.75rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl"
      >
        <AnimatedMoney cents={Math.abs(net)} />
      </motion.div>

      <motion.p variants={item} className="mt-2 min-h-5 text-sm text-hero-foreground/80">
        {caption}
      </motion.p>

      {/* Medidor: quanto do que entrou já foi gasto */}
      <motion.div
        variants={item}
        role="meter"
        aria-label="Parte da receita já gasta"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fill * 100)}
        className="mt-6 h-3 overflow-hidden rounded-full bg-white/20"
      >
        <motion.div
          className={`h-full rounded-full ${over ? "bg-[#ffb4a0]" : "bg-white"}`}
          initial={{ width: reduce ? `${fill * 100}%` : "0%" }}
          animate={{ width: `${fill * 100}%` }}
          transition={{
            duration: reduce ? 0 : 1.1,
            ease: easeOut,
            delay: reduce ? 0 : 0.35,
          }}
        />
      </motion.div>

      <motion.dl variants={item} className="mt-7 grid grid-cols-3 gap-4 sm:max-w-md">
        <Stat label="Entrou" cents={income} />
        <Stat label="Saiu" cents={expense} />
        <Stat label="Saldo total" cents={balance} />
      </motion.dl>
    </motion.section>
  );
}

function Stat({ label, cents }: { label: string; cents: number }) {
  return (
    <div>
      <dt className="text-sm text-hero-foreground/75">{label}</dt>
      <dd className="font-display tabular text-base font-semibold sm:text-lg">
        <AnimatedMoney cents={cents} duration={1.1} />
      </dd>
    </div>
  );
}
