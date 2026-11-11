"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect } from "react";

import { easeOut } from "@/lib/motion";
import { formatBRL } from "@/lib/money";

/**
 * Valor em reais que "conta" até o número final.
 * Na primeira vez parte de zero; quando o valor muda (ex.: troca de mês), parte do que já estava na tela.
 */
export function AnimatedMoney({
  cents,
  className,
  duration = 0.9,
}: {
  cents: number;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const value = useMotionValue(reduce ? cents : 0);
  const text = useTransform(value, (v) => formatBRL(Math.round(v)));

  useEffect(() => {
    if (reduce) {
      value.set(cents);
      return;
    }
    const controls = animate(value, cents, { duration, ease: easeOut });
    return () => controls.stop();
  }, [cents, duration, reduce, value]);

  return (
    <motion.span className={className} aria-label={formatBRL(cents)}>
      {text}
    </motion.span>
  );
}
