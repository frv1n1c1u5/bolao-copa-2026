"use client";

import { useEffect, useState } from "react";

export function CountdownBadge({ kickoff }: { kickoff: string }) {
  const [ms, setMs] = useState(() => new Date(kickoff).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setMs(new Date(kickoff).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [kickoff]);

  if (ms <= 0) return null;

  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  const label = h > 0
    ? `${h}h ${pad(m)}m`
    : m > 0
    ? `${pad(m)}m ${pad(s)}s`
    : `${pad(s)}s`;

  const urgent = ms < 5 * 60 * 1000;  // < 5min
  const warn = ms < 30 * 60 * 1000;   // < 30min

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
        urgent
          ? "bg-red-100 text-red-700 animate-pulse"
          : warn
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700"
      }`}
    >
      ⏱ {label}
    </span>
  );
}
