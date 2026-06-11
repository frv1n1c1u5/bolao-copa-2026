"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDay, formatTime, dayKey, STAGE_LABELS, STAGE_ORDER } from "@/lib/format";

interface TeamInfo {
  code: string;
  name: string;
  flag: string;
}

export interface MatchView {
  num: number;
  stage: string;
  group: string | null;
  kickoff: string;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  home: TeamInfo | null;
  away: TeamInfo | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
}

type Pred = { home: number; away: number };

export function PredictionBoard({
  matches,
  initialPredictions,
}: {
  matches: MatchView[];
  initialPredictions: Record<number, Pred>;
}) {
  const [preds, setPreds] = useState<Record<number, Pred>>(initialPredictions);
  const [drafts, setDrafts] = useState<Record<number, { home: string; away: string }>>({});
  const [saving, setSaving] = useState<Record<number, "saving" | "saved" | "error">>({});
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [onlyPending, setOnlyPending] = useState(false);
  const now = Date.now();

  const visible = useMemo(
    () =>
      matches.filter((m) => {
        if (stageFilter !== "all" && m.stage !== stageFilter) return false;
        if (onlyPending) {
          const started = new Date(m.kickoff).getTime() <= now;
          if (started || preds[m.num]) return false;
        }
        return true;
      }),
    [matches, stageFilter, onlyPending, preds, now]
  );

  const byDay = useMemo(() => {
    const groups = new Map<string, MatchView[]>();
    for (const m of visible) {
      const key = dayKey(new Date(m.kickoff));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return Array.from(groups.entries());
  }, [visible]);

  async function save(m: MatchView) {
    const draft = drafts[m.num];
    if (!draft || draft.home === "" || draft.away === "") return;
    const home = parseInt(draft.home, 10);
    const away = parseInt(draft.away, 10);
    setSaving((s) => ({ ...s, [m.num]: "saving" }));
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchNum: m.num, homeScore: home, awayScore: away }),
    });
    if (res.ok) {
      setPreds((p) => ({ ...p, [m.num]: { home, away } }));
      setSaving((s) => ({ ...s, [m.num]: "saved" }));
      setTimeout(
        () => setSaving((s) => (s[m.num] === "saved" ? { ...s, [m.num]: undefined as never } : s)),
        2000
      );
    } else {
      setSaving((s) => ({ ...s, [m.num]: "error" }));
    }
  }

  const pendingCount = matches.filter(
    (m) => new Date(m.kickoff).getTime() > now && !preds[m.num] && m.home && m.away
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-lg border border-foreground/20 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Todas as fases</option>
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyPending}
            onChange={(e) => setOnlyPending(e.target.checked)}
          />
          Só sem palpite
        </label>
        {pendingCount > 0 && (
          <span className="ml-auto rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-pitch-dark">
            ⚠️ {pendingCount} jogo{pendingCount > 1 ? "s" : ""} sem palpite
          </span>
        )}
      </div>

      {byDay.map(([key, dayMatches]) => (
        <section key={key} className="mb-6">
          <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-pitch-dark">
            {formatDay(new Date(dayMatches[0].kickoff))}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {dayMatches.map((m) => {
              const locked = new Date(m.kickoff).getTime() <= now;
              const pred = preds[m.num];
              const draft = drafts[m.num] ?? {
                home: pred?.home?.toString() ?? "",
                away: pred?.away?.toString() ?? "",
              };
              const state = saving[m.num];
              const undefinedTeams = !m.home || !m.away;
              return (
                <div
                  key={m.num}
                  className={`rounded-xl bg-white p-4 shadow ${locked ? "opacity-80" : ""}`}
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-foreground/50">
                    <span>
                      {STAGE_LABELS[m.stage]}
                      {m.group ? ` · Grupo ${m.group}` : ""} · Jogo {m.num}
                    </span>
                    <span>
                      {formatTime(new Date(m.kickoff))}
                      {locked ? " 🔒" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-right font-bold text-sm">
                      {m.home ? (
                        <>
                          {m.home.name} <span className="text-lg">{m.home.flag}</span>
                        </>
                      ) : (
                        <span className="text-foreground/40">{m.homePlaceholder}</span>
                      )}
                    </span>
                    {locked || undefinedTeams ? (
                      <span className="px-2 font-black text-lg tabular-nums">
                        {m.status === "finished"
                          ? `${m.homeScore} × ${m.awayScore}`
                          : pred
                            ? `${pred.home} × ${pred.away}`
                            : "—"}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={draft.home}
                          onChange={(e) =>
                            setDrafts((d) => ({
                              ...d,
                              [m.num]: { ...draft, home: e.target.value },
                            }))
                          }
                          onBlur={() => save(m)}
                          className="w-12 rounded-lg border border-foreground/20 py-2 text-center font-black"
                        />
                        <span className="text-foreground/40">×</span>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={draft.away}
                          onChange={(e) =>
                            setDrafts((d) => ({
                              ...d,
                              [m.num]: { ...draft, away: e.target.value },
                            }))
                          }
                          onBlur={() => save(m)}
                          className="w-12 rounded-lg border border-foreground/20 py-2 text-center font-black"
                        />
                      </span>
                    )}
                    <span className="flex-1 font-bold text-sm">
                      {m.away ? (
                        <>
                          <span className="text-lg">{m.away.flag}</span> {m.away.name}
                        </>
                      ) : (
                        <span className="text-foreground/40">{m.awayPlaceholder}</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-foreground/40">{m.venue}</span>
                    <span className="flex items-center gap-2">
                      {state === "saving" && <span className="text-foreground/50">salvando…</span>}
                      {state === "saved" && <span className="text-pitch font-bold">✓ salvo</span>}
                      {state === "error" && (
                        <span className="text-red-600 font-bold">erro ao salvar</span>
                      )}
                      {locked && pred && m.status === "finished" && (
                        <span className="text-foreground/60">
                          seu palpite: {pred.home}×{pred.away}
                        </span>
                      )}
                      {locked && (
                        <Link href={`/jogo/${m.num}`} className="text-pitch underline">
                          ver palpites
                        </Link>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {byDay.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-sm shadow">
          Nenhum jogo nesse filtro. 🎉
        </p>
      )}
    </div>
  );
}
