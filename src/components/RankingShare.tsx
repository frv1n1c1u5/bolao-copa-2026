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
      // skipFonts evita CORS ao tentar baixar Geist; usa system font no card
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, skipFonts: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "ranking-copa-2026.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Bolão Copa 2026 — Ranking", files: [file] });
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
      {/* Card renderizado mas oculto — position:fixed+opacity:0 garante que o browser pinte o elemento.
          Todos os estilos são inline (sem classes Tailwind) para que html-to-image resolva corretamente,
          pois Tailwind v4 usa oklch() e variáveis CSS que não resolvem no contexto SVG foreignObject. */}
      <div style={{ position: "fixed", top: 0, left: 0, opacity: 0, pointerEvents: "none", zIndex: -1 }}>
        <div
          ref={cardRef}
          style={{
            width: 480,
            background: "#0a7e3d",
            color: "#ffffff",
            padding: "24px",
            borderRadius: "16px",
            fontFamily: "system-ui, -apple-system, Arial, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "32px", marginBottom: "4px" }}>⚽🏆</div>
            <div style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.5px" }}>
              Bolão Copa 2026
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>
              Família — Classificação atual
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {standings.slice(0, 10).map((s) => (
              <div
                key={s.participantId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              >
                <span style={{ width: "28px", textAlign: "center", fontWeight: 900, color: "#fde047" }}>
                  {medal(s.rank)}
                </span>
                <span style={{ flex: 1, fontWeight: 700, fontSize: "14px" }}>
                  {s.avatar} {s.name}
                </span>
                <span style={{ fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
                  {s.points} pts
                </span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "12px" }}>
            bolao-copa-2026.vercel.app
          </div>
        </div>
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
