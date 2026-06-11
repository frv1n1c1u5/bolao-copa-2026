"use client";

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
];

export function StatsCharts({
  series,
  names,
}: {
  series: Record<string, number | string>[];
  names: string[];
}) {
  if (series.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-lg font-black">Evolução da pontuação</h2>
      <div className="rounded-xl bg-white p-4 shadow">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="jogo" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {names.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
