"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatBRL } from "@/lib/money";

import type { PacePoint } from "../cumulative";

type Datum = { day: number; income: number; expense: number | null };

/**
 * Ritmo do mês: gastos acumulados (área) contra entradas acumuladas (linha).
 * Quando a área passa da linha, você gastou mais do que entrou.
 * `todayDay` corta os gastos no dia atual para o mês corrente não parecer "parado" até o fim.
 */
export function PaceChart({
  points,
  todayDay,
}: {
  points: PacePoint[];
  todayDay: number | null;
}) {
  const data: Datum[] = points.map((p) => ({
    day: p.day,
    income: p.income,
    expense: todayDay !== null && p.day > todayDay ? null : p.expense,
  }));
  const hasData = points.some((p) => p.income > 0 || p.expense > 0);

  if (!hasData) {
    return (
      <p className="text-sm text-muted-foreground">
        O gráfico aparece assim que houver movimentações.
      </p>
    );
  }

  return (
    <figure>
      <div
        className="h-56 w-full"
        role="img"
        aria-label="Gráfico de gastos e entradas acumulados ao longo do mês"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickMargin={8}
            />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as Datum;
                return (
                  <div className="rounded-xl bg-foreground px-3 py-2 text-sm text-background shadow-lg">
                    <p className="font-medium">Dia {label}</p>
                    <p className="tabular">Entrou {formatBRL(row.income)}</p>
                    {row.expense !== null && (
                      <p className="tabular">Gastou {formatBRL(row.expense)}</p>
                    )}
                  </div>
                );
              }}
            />
            <Line
              type="stepAfter"
              dataKey="income"
              stroke="var(--income)"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive
              animationDuration={900}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="var(--expense)"
              strokeWidth={2.5}
              fill="var(--expense)"
              fillOpacity={0.14}
              dot={false}
              isAnimationActive
              animationDuration={1100}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-4 rounded bg-income" /> Entradas acumuladas
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-4 rounded-sm bg-expense/30" /> Gastos
          acumulados
        </span>
      </figcaption>
    </figure>
  );
}
