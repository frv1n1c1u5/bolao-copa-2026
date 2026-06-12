"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { ParticipantTally } from "@/lib/scoring";

const medal = (r: number) => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `${r}º`;

export function RankingShare({ standings }: { standings: ParticipantTally[] }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function share() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "ranking-copa-2026.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Bolão Copa 2026 — Ranking",
          files: [file],
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "ranking-copa-2026.png";
        a.click();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Card invisível capturado como PNG */}
      <div
        ref={cardRef}
        style={{ position: "absolute", left: "-9999px", width: 480 }}
        className="bg-[#0a7e3d] text-white p-6 rounded-2xl font-sans"
      >
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">⚽🏆</div>
          <div className="text-xl font-black tracking-tight">Bolão Copa 2026</div>
          <div className="text-sm opacity-70">Família — Classificação atual</div>
        </div>
        <div className="space-y-1.5">
          {standings.slice(0, 10).map((s) => (
            <div
              key={s.participantId}
              className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2"
            >
              <span className="w-8 text-center font-black text-yellow-300">{medal(s.rank)}</span>
              <span className="flex-1 font-bold text-sm">
                {s.avatar} {s.name}
              </span>
              <span className="font-black tabular-nums">{s.points} pts</span>
            </div>
          ))}
        </div>
        <div className="text-center text-xs opacity-50 mt-3">bolao-copa-2026.vercel.app</div>
      </div>

      <button
        onClick={share}
        disabled={busy}
        className="flex items-center gap-2 rounded-lg bg-pitch px-4 py-2 text-sm font-bold text-white hover:bg-pitch-dark disabled:opacity-50 transition"
      >
        {busy ? "Gerando…" : "📸 Compartilhar Ranking"}
      </button>
    </div>
  );
}
