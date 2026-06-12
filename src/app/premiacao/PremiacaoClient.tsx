"use client";

import { useState } from "react";

interface Prize {
  label: string;
  pct: number;
  icon: string;
}

const DEFAULT_PRIZES: Prize[] = [
  { label: "1º Lugar", pct: 45, icon: "🥇" },
  { label: "2º Lugar", pct: 25, icon: "🥈" },
  { label: "3º Lugar", pct: 15, icon: "🥉" },
  { label: "Artilheiro", pct: 5, icon: "⚽" },
  { label: "Campeão certo", pct: 5, icon: "🏆" },
  { label: "Zebra certa", pct: 5, icon: "🦓" },
];

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
      <div className="rounded-xl bg-white shadow p-6">
        <h2 className="font-black text-xl mb-1">💰 Pote Total</h2>
        <p className="text-sm text-foreground/60 mb-4">
          {numParticipants} participante{numParticipants !== 1 ? "s" : ""} × R$ {entrada.toFixed(2)}
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

        <div className="text-4xl font-black text-pitch">
          R$ {pote.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-pitch text-white text-left text-xs uppercase tracking-wide">
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-center">%</th>
              <th className="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {DEFAULT_PRIZES.map((p) => {
              const valor = (pote * p.pct) / 100;
              return (
                <tr key={p.label} className="border-b border-foreground/5 last:border-0">
                  <td className="px-4 py-3 font-bold">
                    {p.icon} {p.label}
                  </td>
                  <td className="px-4 py-3 text-center text-foreground/60">{p.pct}%</td>
                  <td className="px-4 py-3 text-right font-black text-pitch-dark">
                    R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gold/10 font-black">
              <td className="px-4 py-3">Total distribuído</td>
              <td className="px-4 py-3 text-center">100%</td>
              <td className="px-4 py-3 text-right text-pitch-dark">
                R$ {pote.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-foreground/50 text-center">
        💡 Pagamento feito manualmente fora do app (Pix no grupo da família). Combine o prazo de pagamento antes da Copa começar!
      </p>
    </div>
  );
}
