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
    <div className="space-y-5 md:space-y-6">
      <section className="hero-panel rounded-[1.75rem] p-5 text-white md:p-6">
        <div className="relative z-10 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/78">
              Pote + distribuição
            </span>
            <h2 className="mt-3 text-3xl font-black leading-none">Premiação pronta para o celular</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/74">
              O valor principal aparece primeiro, depois a divisão em blocos curtos e fáceis de
              conferir no grupo da família.
            </p>

            {isAdmin && (
              <label className="mt-4 inline-flex flex-wrap items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">
                Valor de entrada
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={entrada}
                  onChange={(e) => setEntrada(Number(e.target.value))}
                  onBlur={() => saveEntrada(entrada)}
                  className="w-28 rounded-xl border border-white/15 bg-white px-3 py-2 text-right text-pitch-dark outline-none"
                />
                {saving && <span className="text-xs text-gold">salvando…</span>}
              </label>
            )}
          </div>

          <div className="glass-panel rounded-[1.5rem] p-4 text-foreground">
            <div className="text-xs uppercase tracking-[0.16em] text-foreground/52">Pote atual</div>
            <div className="mt-2 text-4xl font-black text-gold">R$ {fmt(pote)}</div>
            <div className="mt-2 text-sm text-foreground/68">
              {numParticipants} participante{numParticipants !== 1 ? "s" : ""} × R$ {fmt(entrada)}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-white/55 px-2 py-3 ring-1 ring-black/5">
                <div className="font-black text-lg text-pitch-dark">{PODIUM[0].pct}%</div>
                <div className="text-foreground/58">campeão</div>
              </div>
              <div className="rounded-2xl bg-white/55 px-2 py-3 ring-1 ring-black/5">
                <div className="font-black text-lg text-pitch-dark">15%</div>
                <div className="text-foreground/58">3º lugar</div>
              </div>
              <div className="rounded-2xl bg-white/55 px-2 py-3 ring-1 ring-black/5">
                <div className="font-black text-lg text-pitch-dark">15%</div>
                <div className="text-foreground/58">bônus</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[1.5rem] p-4 md:p-5">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Pódio enxuto</span>
            <h3 className="mt-2 text-xl font-black">Distribuição principal</h3>
          </div>
          <span className="text-xs text-foreground/45">layout otimizado para leitura vertical</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {PODIUM.map((prize, index) => {
            const destaque = index === 0;
            return (
              <div
                key={prize.label}
                className={`rounded-[1.5rem] p-4 ${
                  destaque
                    ? "bg-[color:var(--header-bg)] text-white shadow-lg"
                    : "bg-white/72 ring-1 ring-black/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-3xl">{prize.icon}</div>
                  <div
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${
                      destaque ? "bg-gold text-pitch-dark" : "bg-foreground/8 text-foreground/60"
                    }`}
                  >
                    {prize.pct}%
                  </div>
                </div>
                <div className={`mt-4 text-sm font-black ${destaque ? "text-gold" : "text-pitch-dark"}`}>
                  {prize.label}
                </div>
                <div className={`mt-1 text-2xl font-black ${destaque ? "text-white" : "text-foreground"}`}>
                  R$ {fmt((pote * prize.pct) / 100)}
                </div>
                <p className={`mt-2 text-xs ${destaque ? "text-white/70" : "text-foreground/55"}`}>
                  {index === 0
                    ? "Maior fatia do pote, destacada no topo."
                    : index === 1
                    ? "Ainda leva uma parcela relevante da disputa."
                    : "Fecha o pódio sem virar número escondido."}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface-card rounded-[1.5rem] p-4 md:p-5">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Bônus separados</span>
            <h3 className="mt-2 text-xl font-black">Prêmios extras</h3>
          </div>
          <span className="text-xs text-foreground/45">todos com a mesma fatia</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {BONUSES.map((p) => {
            const valor = (pote * p.pct) / 100;
            return (
              <div key={p.label} className="rounded-[1.35rem] bg-white/72 p-4 ring-1 ring-black/5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <span className="rounded-full bg-gold/18 px-2.5 py-1 text-xs font-black text-pitch-dark">
                    {p.pct}%
                  </span>
                </div>
                <div className="mt-3 text-sm font-black">{p.label}</div>
                <div className="mt-1 text-xl font-black text-pitch-dark">R$ {fmt(valor)}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-[1.35rem] bg-gold/12 px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-black">Total distribuído</span>
            <span className="font-black text-pitch-dark">100% • R$ {fmt(pote)}</span>
          </div>
        </div>
      </section>

      <details className="surface-card rounded-[1.35rem] p-4 text-sm">
        <summary className="cursor-pointer font-bold text-pitch">Ver distribuição completa</summary>
        <div className="mt-4 space-y-2">
          {ALL_PRIZES.map((p) => (
            <div
              key={p.label}
              className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-3 ring-1 ring-black/5"
            >
              <span className="text-xl">{p.icon}</span>
              <span className="flex-1 font-medium">{p.label}</span>
              <span className="text-foreground/55">{p.pct}%</span>
              <span className="font-black text-pitch-dark">R$ {fmt((pote * p.pct) / 100)}</span>
            </div>
          ))}
        </div>
      </details>

      <p className="text-center text-xs text-foreground/55">
        💡 O pagamento continua manual fora do app. Aqui a ideia é deixar a divisão clara e fácil
        de conferir no celular.
      </p>
    </div>
  );
}
