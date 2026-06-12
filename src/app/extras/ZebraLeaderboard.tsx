"use client";

import { STAGE_LABELS } from "@/lib/format";

interface ZebraEntry {
  name: string;
  avatar: string;
  teamCode: string;
  teamFlag: string;
  teamName: string;
  stageIndex: number;
  isMe: boolean;
}

export function ZebraLeaderboard({ entries }: { entries: ZebraEntry[] }) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.stageIndex - a.stageIndex);
  const bestIdx = sorted[0]?.stageIndex ?? -1;

  const stageLabel = (idx: number) => {
    if (idx < 0) return "ainda não jogou";
    const stages = ["group", "r32", "r16", "qf", "sf", "third", "final"];
    return STAGE_LABELS[stages[idx]] ?? "—";
  };

  return (
    <section className="mt-8">
      <h2 className="text-lg font-black mb-1">🦓 Zebra — quem vai mais longe</h2>
      <p className="text-xs text-foreground/50 mb-3">
        Vence quem escolheu a seleção que chegou mais longe entre os palpites de zebra.
      </p>
      <div className="rounded-xl bg-white shadow divide-y divide-foreground/5">
        {sorted.map((e, i) => {
          const isLeading = e.stageIndex === bestIdx && bestIdx >= 0;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 text-sm ${
                e.isMe ? "bg-gold/10" : ""
              }`}
            >
              <span className="font-bold flex-1">
                {e.avatar} {e.name}
                {e.isMe && <span className="ml-1 text-xs text-pitch">(você)</span>}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-base">{e.teamFlag}</span>
                <span className="text-foreground/70">{e.teamName}</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  isLeading
                    ? "bg-green-100 text-green-700"
                    : "bg-foreground/5 text-foreground/50"
                }`}
              >
                {isLeading && "🏅 "}
                {stageLabel(e.stageIndex)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
