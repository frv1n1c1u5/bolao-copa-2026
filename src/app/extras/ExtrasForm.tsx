"use client";

import { useState } from "react";

interface Team {
  code: string;
  name: string;
  flag: string;
}

const EXTRA_FIELDS = [
  { category: "artilheiro", label: "⚽ Artilheiro da Copa", placeholder: "Ex: Mbappé" },
  { category: "craque", label: "🌟 Craque da Copa (melhor jogador)", placeholder: "Ex: Messi" },
  { category: "zebra", label: "🦓 Seleção surpresa (zebra que vai longe)", placeholder: "Ex: Curaçao" },
];

export function ExtrasForm({
  teams,
  championPick,
  championLocked,
  extras,
  extrasLocked,
}: {
  teams: Team[];
  championPick: string | null;
  championLocked: boolean;
  extras: Record<string, string>;
  extrasLocked: boolean;
}) {
  const [champion, setChampion] = useState(championPick ?? "");
  const [values, setValues] = useState(extras);
  const [status, setStatus] = useState<Record<string, string>>({});

  async function saveChampion(code: string) {
    setChampion(code);
    setStatus((s) => ({ ...s, champion: "salvando…" }));
    const res = await fetch("/api/extras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "champion", teamCode: code }),
    });
    setStatus((s) => ({ ...s, champion: res.ok ? "✓ salvo" : "erro ao salvar" }));
  }

  async function saveExtra(category: string) {
    const value = values[category];
    if (!value?.trim()) return;
    setStatus((s) => ({ ...s, [category]: "salvando…" }));
    const res = await fetch("/api/extras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "extra", category, value }),
    });
    setStatus((s) => ({ ...s, [category]: res.ok ? "✓ salvo" : "erro ao salvar" }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="font-black mb-1">
          🏆 Campeão da Copa {championLocked && <span className="text-xs">🔒 travado</span>}
        </h2>
        <p className="text-xs text-foreground/50 mb-3">
          Vale +5 pontos. Pode trocar até o admin travar (antes das oitavas).
        </p>
        <div className="flex items-center gap-3">
          <select
            value={champion}
            disabled={championLocked}
            onChange={(e) => saveChampion(e.target.value)}
            className="flex-1 rounded-lg border border-foreground/20 bg-white px-3 py-2 disabled:opacity-60"
          >
            <option value="">— escolha a seleção —</option>
            {teams.map((t) => (
              <option key={t.code} value={t.code}>
                {t.flag} {t.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-pitch font-bold w-20">{status.champion}</span>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow space-y-4">
        <h2 className="font-black">
          Bolões extras {extrasLocked && <span className="text-xs">🔒 travados</span>}
        </h2>
        {EXTRA_FIELDS.map((f) => (
          <div key={f.category}>
            <label className="block text-sm font-bold mb-1">{f.label}</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={values[f.category] ?? ""}
                disabled={extrasLocked}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.category]: e.target.value }))
                }
                onBlur={() => saveExtra(f.category)}
                className="flex-1 rounded-lg border border-foreground/20 px-3 py-2 disabled:opacity-60"
              />
              <span className="text-xs text-pitch font-bold w-20">{status[f.category]}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
