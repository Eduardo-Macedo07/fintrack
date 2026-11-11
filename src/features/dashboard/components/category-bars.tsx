"use client";

import { motion, useReducedMotion } from "motion/react";

import { formatBRL } from "@/lib/money";
import { easeOut } from "@/lib/motion";

type Row = { categoryId: string | null; name: string; color: string; amount: number };

const MAX_ROWS = 6;

/** Para onde foi o dinheiro: barras por categoria, da maior para a menor. */
export function CategoryBars({ rows }: { rows: Row[] }) {
  const reduce = useReducedMotion();
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma despesa registrada neste mês.
      </p>
    );
  }

  // Agrupa o excedente em "Outras" para a lista continuar curta e legível.
  const visible = rows.slice(0, MAX_ROWS);
  const rest = rows.slice(MAX_ROWS);
  const list: Row[] = rest.length
    ? [
        ...visible,
        {
          categoryId: "others",
          name: "Outras",
          color: "#94a3b8",
          amount: rest.reduce((s, r) => s + r.amount, 0),
        },
      ]
    : visible;

  return (
    <ul className="grid gap-4">
      {list.map((row, i) => {
        const share = row.amount / total;
        return (
          <li key={row.categoryId ?? row.name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <span className="truncate">{row.name}</span>
              </span>
              <span className="tabular shrink-0 text-sm">
                {formatBRL(row.amount)}{" "}
                <span className="text-muted-foreground">
                  ({Math.round(share * 100)}%)
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: row.color }}
                initial={{ width: reduce ? `${share * 100}%` : 0 }}
                animate={{ width: `${share * 100}%` }}
                transition={{
                  duration: reduce ? 0 : 0.8,
                  ease: easeOut,
                  delay: reduce ? 0 : 0.5 + i * 0.07,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
