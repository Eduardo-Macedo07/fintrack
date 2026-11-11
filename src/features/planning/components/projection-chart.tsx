"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatBRL } from "@/lib/money";

import { formatDuration, type ProjectionPoint } from "../projection";

/** Quanto você guardou (linha) contra o total com rendimento (área). A distância entre as duas é o rendimento. */
export function ProjectionChart({ points }: { points: ProjectionPoint[] }) {
  const lastMonth = points[points.length - 1]?.month ?? 0;
  // Um rótulo por ano até 6 anos; depois, de 2 em 2 (e de 3 em 3) para não apertar o eixo.
  const step = lastMonth <= 72 ? 12 : lastMonth <= 120 ? 24 : 36;
  const ticks = points
    .filter((p) => p.month > 0 && p.month % step === 0)
    .map((p) => p.month);

  return (
    <figure>
      <div
        className="h-60 w-full"
        role="img"
        aria-label="Gráfico do quanto você guardou e do total com rendimento ao longo do tempo"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              ticks={ticks}
              tickFormatter={(m: number) => `${m / 12} ${m / 12 === 1 ? "ano" : "anos"}`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickMargin={8}
            />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as ProjectionPoint;
                return (
                  <div className="rounded-xl bg-foreground px-3 py-2 text-sm text-background shadow-lg">
                    <p className="font-medium">
                      {p.month === 0 ? "Hoje" : `Daqui a ${formatDuration(p.month)}`}
                    </p>
                    <p className="tabular">Guardado {formatBRL(p.contributed)}</p>
                    <p className="tabular">Total {formatBRL(p.total)}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="var(--primary)"
              fillOpacity={0.14}
              dot={false}
              isAnimationActive
              animationDuration={900}
            />
            <Area
              type="monotone"
              dataKey="contributed"
              stroke="var(--muted-foreground)"
              strokeWidth={2}
              strokeDasharray="5 4"
              fill="none"
              dot={false}
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-4 rounded-sm bg-primary/30" /> Total com
          rendimento
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="w-4 border-t-2 border-dashed border-muted-foreground"
          />{" "}
          O que você guardou
        </span>
      </figcaption>
    </figure>
  );
}
