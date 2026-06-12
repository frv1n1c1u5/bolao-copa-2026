"use client";

import { useState } from "react";
import { ZEBRA_TEAMS } from "@/lib/zebra";
import { toast } from "@/lib/toast";

interface Team {
  code: string;
  name: string;
  flag: string;
}

const TEXT_FIELDS = [
  { category: "artilheiro", label: "⚽ Artilheiro da Copa", placeholder: "Ex: Mbappé" },
  { category: "craque", label: "🌟 Craque da Copa (melhor jogador)", placeholder: "Ex: Messi" },
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
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const teamByCode = new Map(teams.map((t) => [t.code, t]));

  async function saveChampion(code: string) {
    setChampion(code);
    setSaving((s) => ({ ...s, champion: true }));
    const res = await fetch("/api/extras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "champion", teamCode: code }),
    });
    setSaving((s) => ({ ...s, champion: false }));
    const team = teamByCode.get(code);
    if (res.ok) toast(`✓ Campeão salvo: ${team?.flag ?? ""} ${team?.name ?? code}`);
    else toast("Erro ao salvar campeão", "error");
  }

  async function saveExtra(category: string) {
    const value = values[category];
    if (!value?.trim()) return;
    setSaving((s) => ({ ...s, [category]: true }));
    const res = await fetch("/api/extras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "extra", category, value }),
    });
    setSaving((s) => ({ ...s, [category]: false }));
    if (res.ok) toast("✓ Salvo");
    else toast("Erro ao salvar", "error");
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
            disabled={championLocked || saving.champion}
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
          {saving.champion && <span className="text-xs text-foreground/50">salvando…</span>}
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow space-y-4">
        <h2 className="font-black">
          Bolões extras {extrasLocked && <span className="text-xs">🔒 travados</span>}
        </h2>
        {TEXT_FIELDS.map((f) => (
          <div key={f.category}>
            <label className="block text-sm font-bold mb-1">{f.label}</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={values[f.category] ?? ""}
                disabled={extrasLocked || saving[f.category]}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.category]: e.target.value }))
                }
                onBlur={() => saveExtra(f.category)}
                className="flex-1 rounded-lg border border-foreground/20 px-3 py-2 disabled:opacity-60"
              />
              {saving[f.category] && <span className="text-xs text-foreground/50 w-16">salvando…</span>}
            </div>
          </div>
        ))}

        {/* Zebra — dropdown de azarões credíveis */}
        <div>
          <label className="block text-sm font-bold mb-1">
            🦓 Zebra da Copa{" "}
            <span className="font-normal text-foreground/50">— qual azarão vai mais longe?</span>
          </label>
          <p className="text-xs text-foreground/40 mb-2">
            Vence quem escolheu o time que chegou mais longe entre todas as zebras apostadas.
          </p>
          <div className="flex items-center gap-3">
            <select
              value={values["zebra"] ?? ""}
              disabled={extrasLocked || saving["zebra"]}
              onChange={(e) => {
                const code = e.target.value;
                setValues((v) => ({ ...v, zebra: code }));
                if (code) {
                  setSaving((s) => ({ ...s, zebra: true }));
                  const team = teamByCode.get(code);
                  fetch("/api/extras", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "extra", category: "zebra", value: code }),
                  }).then((r) => {
                    setSaving((s) => ({ ...s, zebra: false }));
                    if (r.ok) toast(`✓ Zebra salva: ${team?.flag ?? ""} ${team?.name ?? code}`);
                    else toast("Erro ao salvar zebra", "error");
                  });
                }
              }}
              className="flex-1 rounded-lg border border-foreground/20 bg-white px-3 py-2 disabled:opacity-60"
            >
              <option value="">— escolha a zebra —</option>
              {ZEBRA_TEAMS.map((z) => {
                const t = teamByCode.get(z.code);
                return (
                  <option key={z.code} value={z.code} title={z.reason}>
                    {t?.flag ?? ""} {t?.name ?? z.code} — {z.reason}
                  </option>
                );
              })}
            </select>
            {saving["zebra"] && <span className="text-xs text-foreground/50">salvando…</span>}
          </div>
          {values["zebra"] && (() => {
            const t = teamByCode.get(values["zebra"]);
            const meta = ZEBRA_TEAMS.find((z) => z.code === values["zebra"]);
            return t ? (
              <p className="mt-1.5 text-xs text-foreground/50 italic">{meta?.reason}</p>
            ) : null;
          })()}
        </div>
      </section>
    </div>
  );
}
