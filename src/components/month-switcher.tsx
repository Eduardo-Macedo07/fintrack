"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { formatMonthLabel, shiftMonth } from "@/lib/dates";
import { easeOut } from "@/lib/motion";

/** Navega entre meses pela URL (?month=2026-11), preservando os outros filtros. */
export function MonthSwitcher({
  month,
  tone = "default",
}: {
  month: string;
  tone?: "default" | "onHero";
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const direction = useDirection(month);

  const href = (delta: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("month", shiftMonth(month, delta));
    return `${pathname}?${next.toString()}`;
  };

  const button =
    tone === "onHero"
      ? "text-hero-foreground/80 hover:bg-white/15 hover:text-hero-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground";

  return (
    <div className="flex items-center gap-1">
      <Link
        href={href(-1)}
        scroll={false}
        aria-label="Mês anterior"
        className={`grid size-9 place-items-center rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${button}`}
      >
        <ChevronLeft className="size-5" />
      </Link>
      <div className="relative h-7 w-44 overflow-hidden text-center">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.span
            key={month}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: 18 * d }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: -18 * d }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: easeOut }}
            className="font-display absolute inset-0 text-lg leading-7 font-semibold first-letter:uppercase"
            aria-live="polite"
          >
            {formatMonthLabel(month)}
          </motion.span>
        </AnimatePresence>
      </div>
      <Link
        href={href(1)}
        scroll={false}
        aria-label="Próximo mês"
        className={`grid size-9 place-items-center rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${button}`}
      >
        <ChevronRight className="size-5" />
      </Link>
    </div>
  );
}

/** +1 se o mês avançou, -1 se voltou: define de que lado o rótulo entra. */
function useDirection(month: string) {
  const [previous, setPrevious] = useState(month);
  const [direction, setDirection] = useState(1);
  if (month !== previous) {
    // Ajuste de estado durante a renderização (padrão oficial do React; sem ref).
    setPrevious(month);
    setDirection(month > previous ? 1 : -1);
  }
  return direction;
}
