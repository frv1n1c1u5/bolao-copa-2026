"use client";

import { useState } from "react";

interface Prize {
  label: string;
  pct: number;
  icon: string;
}

const PODIUM: Prize[] = [
  { label: "1º Lugar", pct: 45, icon: "🥇" },
  { label: "2º Lugar", pct: 25, icon: "🥈" },
  { label: "3º Lugar", pct: 15, icon: "🥉" },
];

const BONUSES: Prize[] = [
  { label: "Artilheiro", pct: 5, icon: "⚽" },
  { label: "Campeão certo", pct: 5, icon: "🏆" },
  { label: "Zebra certa", pct: 5, icon: "🦓" },
];

const ALL_PRIZES = [...PODIUM, ...BONUSES];

export function PremiacaoClient({
  numParticipants,
  isAdmin,
  savedEntrada,
}: {
  numParticipants: number;
  isAdmin: boolean;
  savedEntrada: number;
}) {
  const [entrada, setEntrada] = useState(savedEntrada);
  const [saving, setSaving] = useState(false);

  const pote = numParticipants * entrada;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  async function saveEntrada(val: number) {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "valor_entrada", value: String(val) }),
    });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Pote total */}
      <div className="rounded-xl bg-white shadow p-6">
        <h2 className="font-black text-xl mb-1">💰 Pote Total</h2>
        <p className="text-sm text-foreground/60 mb-4">
          {numParticipants} participante{numParticipants !== 1 ? "s" : ""} × R$ {fmt(entrada)}
        </p>

        {isAdmin && (
          <label className="flex items-center gap-3 mb-4 text-sm font-bold">
            Valor de entrada:
            <input
              type="number"
              min={0}
              step={5}
              value={entrada}
              onChange={(e) => setEntrada(Number(e.target.value))}
              onBlur={() => saveEntrada(entrada)}
              className="w-28 rounded-lg border border-foreground/20 px-3 py-1.5 text-right"
            />
            {saving && <span className="text-xs text-pitch">salvando…</span>}
          </label>
        )}

        <div className="text-5xl font-black text-pitch">
          R$ {fmt(pote)}
        </div>
      </div>

      {/* Pódio — top 3 */}
      <div>
        <h2 className="font-black text-lg mb-3">🏆 Distribuição dos prêmios</h2>

        {/* Pódio visual: 2º | 1º | 3º */}
        <div className="flex items-end justify-center gap-3 mb-4">
          {/* 2º lugar */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-3xl mb-1">{PODIUM[1].icon}</span>
            <div className="rounded-xl bg-white shadow p-4 text-center w-full border-t-4 border-foreground/20">
              <p className="font-black text-sm">{PODIUM[1].label}</p>
              <p className="text-foreground/50 text-xs">{PODIUM[1].pct}%</p>
              <p className="font-black text-pitch-dark text-lg mt-1">
                R$ {fmt((pote * PODIUM[1].pct) / 100)}
              </p>
            </div>
            <div className="h-12 w-full bg-foreground/10 rounded-b-lg" />
          </div>

          {/* 1º lugar — mais alto */}
          <div className="flex flex-col items-center flex-1 -mb-4">
            <span className="text-4xl mb-1">{PODIUM[0].icon}</span>
            <div className="rounded-xl bg-pitch shadow-lg p-4 text-center w-full border-t-4 border-gold text-white">
              <p className="font-black">{PODIUM[0].label}</p>
              <p className="text-white/60 text-xs">{PODIUM[0].pct}%</p>
              <p className="font-black text-gold text-xl mt-1">
                R$ {fmt((pote * PODIUM[0].pct) / 100)}
              </p>
            </div>
            <div className="h-20 w-full bg-pitch/20 rounded-b-lg" />
          </div>

          {/* 3º lugar */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-3xl mb-1">{PODIUM[2].icon}</span>
            <div className="rounded-xl bg-white shadow p-4 text-center w-full border-t-4 border-foreground/10">
              <p className="font-black text-sm">{PODIUM[2].label}</p>
              <p className="text-foreground/50 text-xs">{PODIUM[2].pct}%</p>
              <p className="font-black text-pitch-dark text-lg mt-1">
                R$ {fmt((pote * PODIUM[2].pct) / 100)}
              </p>
            </div>
            <div className="h-8 w-full bg-foreground/5 rounded-b-lg" />
          </div>
        </div>
      </div>

      {/* Bônus extras */}
      <div className="rounded-xl bg-white shadow overflow-hidden">
        <div className="px-4 py-3 bg-foreground/5 border-b border-foreground/10">
          <h3 className="font-black text-sm">⭐ Prêmios bônus</h3>
        </div>
        {BONUSES.map((p) => {
          const valor = (pote * p.pct) / 100;
          return (
            <div
              key={p.label}
              className="flex items-center gap-3 px-4 py-3 border-b border-foreground/5 last:border-0"
            >
              <span className="text-xl">{p.icon}</span>
              <span className="flex-1 font-bold text-sm">{p.label}</span>
              <span className="text-xs text-foreground/50">{p.pct}%</span>
              <span className="font-black text-pitch-dark">R$ {fmt(valor)}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-3 px-4 py-3 bg-gold/10">
          <span className="flex-1 font-black text-sm">Total distribuído</span>
          <span className="text-xs text-foreground/50">100%</span>
          <span className="font-black text-pitch-dark">R$ {fmt(pote)}</span>
        </div>
      </div>

      {/* Resumo da distribuição (oculto, mas disponível) */}
      <details className="text-xs text-foreground/40">
        <summary className="cursor-pointer hover:text-foreground/60">Ver distribuição completa</summary>
        <div className="mt-2 space-y-1 pl-2">
          {ALL_PRIZES.map((p) => (
            <div key={p.label} className="flex gap-2">
              <span>{p.icon}</span>
              <span className="flex-1">{p.label}</span>
              <span>{p.pct}% = R$ {fmt((pote * p.pct) / 100)}</span>
            </div>
          ))}
        </div>
      </details>

      <p className="text-xs text-foreground/50 text-center">
        💡 Pagamento feito manualmente fora do app (Pix no grupo da família). Combine o prazo antes da Copa começar!
      </p>
    </div>
  );
}
