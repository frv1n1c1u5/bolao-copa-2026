"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#0a7e3d",
  "#f5b400",
  "#1d4ed8",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#ea580c",
  "#be185d",
  "#4d7c0f",
  "#78350f",
  "#0f766e",
  "#92400e",
];

export function StatsCharts({
  series,
  names,
}: {
  series: Record<string, number | string>[];
  names: string[];
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  if (series.length === 0) return null;

  function toggleLine(name: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <section>
      <h2 className="mb-1 text-lg font-black">Evolução da pontuação</h2>
      <p className="text-xs text-foreground/50 mb-2">Clique no nome para mostrar/ocultar.</p>
      <div className="rounded-xl bg-white p-4 shadow">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="jogo" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend
              onClick={(e) => toggleLine(e.dataKey as string)}
              formatter={(value: string) => (
                <span
                  style={{
                    opacity: hidden.has(value) ? 0.35 : 1,
                    cursor: "pointer",
                    textDecoration: hidden.has(value) ? "line-through" : "none",
                  }}
                >
                  {value}
                </span>
              )}
            />
            {names.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={hidden.has(name) ? 0 : 2}
                strokeOpacity={hidden.has(name) ? 0 : 1}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
