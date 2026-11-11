"use client";

import { motion } from "motion/react";

import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Classe da pílula quando selecionada (ex.: cor de receita/despesa). */
  activeClassName?: string;
};

/**
 * Controle segmentado com pílula que desliza até a opção escolhida.
 *
 * A posição da pílula é calculada pelo índice da opção (opções têm a mesma largura),
 * e não medida na tela: assim ela não "tremula" quando o contêiner muda de lugar
 * (ex.: diálogo que se recentraliza ao aparecer uma mensagem de erro).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const active = options[index];

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("relative inline-flex rounded-full bg-muted p-1", className)}
    >
      <motion.span
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 left-1 rounded-full bg-primary",
          active?.activeClassName,
        )}
        style={{ width: `calc((100% - 0.5rem) / ${options.length})` }}
        animate={{ x: `${index * 100}%` }}
        initial={false}
        transition={spring}
      />
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 flex-1 basis-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              isActive ? "text-white" : "text-muted-foreground hover:text-foreground",
              isActive && !option.activeClassName && "text-primary-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
