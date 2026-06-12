"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatKickoff, STAGE_LABELS } from "@/lib/format";
import type { MatchView } from "@/app/palpites/PredictionBoard";
import { AvatarPicker } from "@/components/AvatarPicker";

interface Person {
  id: number;
  name: string;
  avatar: string;
  isAdmin: boolean;
}

interface Team {
  code: string;
  name: string;
  flag: string;
}

interface ExtraPick {
  participantId: number;
  category: string;
  value: string;
  pointsAwarded: number;
}

type Tab = "resultados" | "confrontos" | "participantes" | "extras" | "config";

export function AdminPanel({
  matches,
  people,
  teams,
  extras,
  championOpen,
  extrasOpen,
  championCode,
  syncAvailable,
}: {
  matches: MatchView[];
  people: Person[];
  teams: Team[];
  extras: ExtraPick[];
  championOpen: boolean;
  extrasOpen: boolean;
  championCode: string | null;
  syncAvailable: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("resultados");
  const [msg, setMsg] = useState("");

  async function call(url: string, body?: unknown, method = "POST") {
    setMsg("…");
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg("✓ feito");
      router.refresh();
    } else {
      setMsg(`❌ ${data.error ?? res.status}`);
    }
    return res.ok;
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "resultados", label: "Resultados" },
    { id: "confrontos", label: "Mata-mata" },
    { id: "participantes", label: "Participantes" },
    { id: "extras", label: "Extras" },
    { id: "config", label: "Configurações" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              tab === t.id ? "bg-pitch text-white" : "bg-white shadow hover:bg-pitch/10"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-sm font-bold text-pitch">{msg}</span>
      </div>

      {tab === "resultados" && (
        <ResultsTab matches={matches} call={call} syncAvailable={syncAvailable} />
      )}
      {tab === "confrontos" && <MatchupsTab matches={matches} teams={teams} call={call} />}
      {tab === "participantes" && <PeopleTab people={people} call={call} />}
      {tab === "extras" && <ExtrasTab extras={extras} people={people} call={call} />}
      {tab === "config" && (
        <ConfigTab
          championOpen={championOpen}
          extrasOpen={extrasOpen}
          championCode={championCode}
          teams={teams}
          call={call}
        />
      )}
    </div>
  );
}

function ResultsTab({
  matches,
  call,
  syncAvailable,
}: {
  matches: MatchView[];
  call: (url: string, body?: unknown, method?: string) => Promise<boolean>;
  syncAvailable: boolean;
}) {
  const [drafts, setDrafts] = useState<Record<number, { home: string; away: string }>>({});
  const [syncing, setSyncing] = useState(false);
  const [savingMatch, setSavingMatch] = useState<Record<number, boolean>>({});
  const [gameWeek, setGameWeek] = useState("1");
  const now = Date.now();
  // Mostra jogos que já começaram e ainda não têm resultado, mais os recém-encerrados.
  const editable = matches
    .filter((m) => new Date(m.kickoff).getTime() <= now && m.home && m.away)
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());

  return (
    <div className="space-y-3">
      {syncAvailable && (
        <button
          onClick={async () => {
            setSyncing(true);
            await call("/api/admin/sync");
            setSyncing(false);
          }}
          disabled={syncing}
          className="rounded-lg bg-gold px-4 py-2 font-bold text-pitch-dark hover:brightness-110 transition disabled:opacity-50"
        >
          {syncing ? "Sincronizando…" : "🔄 Sincronizar com football-data.org"}
        </button>
      )}
      {!syncAvailable && (
        <p className="text-xs text-foreground/50">
          Configure FOOTBALL_DATA_API_KEY para habilitar a sincronização automática.
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold">Calcular badges da rodada:</span>
        <input
          type="number"
          min={1}
          value={gameWeek}
          onChange={(e) => setGameWeek(e.target.value)}
          className="w-16 rounded-lg border border-foreground/20 px-2 py-1.5 text-center"
        />
        <button
          onClick={() => {
            const finished = matches
              .filter((m) => m.status === "finished")
              .map((m) => m.num);
            call("/api/admin/badges", { gameWeek: parseInt(gameWeek, 10), matchNums: finished });
          }}
          className="rounded-lg bg-foreground/10 px-4 py-1.5 text-sm font-bold hover:bg-foreground/20 transition"
        >
          🏅 Calcular badges
        </button>
      </div>
      {editable.length === 0 && (
        <p className="rounded-xl bg-white p-6 shadow text-sm">
          Nenhum jogo iniciado aguardando resultado.
        </p>
      )}
      {editable.map((m) => {
        const draft = drafts[m.num] ?? {
          home: m.homeScore?.toString() ?? "",
          away: m.awayScore?.toString() ?? "",
        };
        return (
          <div key={m.num} className="rounded-xl bg-white p-4 shadow flex flex-wrap items-center gap-3 text-sm">
            <span className="text-xs text-foreground/50 w-32">
              Jogo {m.num} · {STAGE_LABELS[m.stage]}
              <br />
              {formatKickoff(new Date(m.kickoff))}
            </span>
            <span className="flex-1 text-right font-bold">
              {m.home?.name} {m.home?.flag}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.home}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [m.num]: { ...draft, home: e.target.value } }))
              }
              className="w-14 rounded-lg border border-foreground/20 py-2 text-center font-black"
            />
            <span>×</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.away}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [m.num]: { ...draft, away: e.target.value } }))
              }
              className="w-14 rounded-lg border border-foreground/20 py-2 text-center font-black"
            />
            <span className="flex-1 font-bold">
              {m.away?.flag} {m.away?.name}
            </span>
            <button
              onClick={async () => {
                setSavingMatch((s) => ({ ...s, [m.num]: true }));
                await call("/api/admin/results", {
                  matchNum: m.num,
                  homeScore: parseInt(draft.home, 10),
                  awayScore: parseInt(draft.away, 10),
                });
                setSavingMatch((s) => ({ ...s, [m.num]: false }));
              }}
              disabled={draft.home === "" || draft.away === "" || savingMatch[m.num]}
              className="rounded-lg bg-pitch px-3 py-2 font-bold text-white hover:bg-pitch-dark transition disabled:opacity-40 min-w-[70px]"
            >
              {savingMatch[m.num] ? "…" : "Salvar"}
            </button>
            {m.status === "finished" && (
              <button
                onClick={() => call("/api/admin/results", { matchNum: m.num, clear: true })}
                className="text-xs text-red-600 underline"
              >
                limpar
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MatchupsTab({
  matches,
  teams,
  call,
}: {
  matches: MatchView[];
  teams: Team[];
  call: (url: string, body?: unknown, method?: string) => Promise<boolean>;
}) {
  const knockout = matches.filter((m) => m.stage !== "group");
  const [drafts, setDrafts] = useState<Record<number, { home: string; away: string }>>({});

  return (
    <div className="space-y-3">
      <p className="text-xs text-foreground/50">
        Defina as seleções de cada jogo do mata-mata conforme a Copa avança (ou use o
        sync). Palpites só são possíveis depois que o confronto está definido.
      </p>
      {knockout.map((m) => {
        const draft = drafts[m.num] ?? {
          home: m.home?.code ?? "",
          away: m.away?.code ?? "",
        };
        return (
          <div key={m.num} className="rounded-xl bg-white p-4 shadow flex flex-wrap items-center gap-3 text-sm">
            <span className="text-xs text-foreground/50 w-36">
              Jogo {m.num} · {STAGE_LABELS[m.stage]}
              <br />
              {formatKickoff(new Date(m.kickoff))}
            </span>
            <select
              value={draft.home}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [m.num]: { ...draft, home: e.target.value } }))
              }
              className="flex-1 min-w-40 rounded-lg border border-foreground/20 bg-white px-2 py-2"
            >
              <option value="">{m.homePlaceholder ?? "—"}</option>
              {teams.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
            <span>×</span>
            <select
              value={draft.away}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [m.num]: { ...draft, away: e.target.value } }))
              }
              className="flex-1 min-w-40 rounded-lg border border-foreground/20 bg-white px-2 py-2"
            >
              <option value="">{m.awayPlaceholder ?? "—"}</option>
              {teams.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                call("/api/admin/matchup", {
                  matchNum: m.num,
                  homeCode: draft.home,
                  awayCode: draft.away,
                })
              }
              className="rounded-lg bg-pitch px-3 py-2 font-bold text-white hover:bg-pitch-dark transition"
            >
              Salvar
            </button>
          </div>
        );
      })}
    </div>
  );
}

function PeopleTab({
  people,
  call,
}: {
  people: Person[];
  call: (url: string, body?: unknown, method?: string) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [resetPins, setResetPins] = useState<Record<number, string>>({});
  const [confirmReset, setConfirmReset] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="font-black mb-3">Novo participante</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-sm font-bold">
            Nome
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block rounded-lg border border-foreground/20 px-3 py-2"
            />
          </label>
          <label className="text-sm font-bold">
            PIN (4 dígitos)
            <input
              value={pin}
              maxLength={4}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="mt-1 block w-24 rounded-lg border border-foreground/20 px-3 py-2 text-center"
            />
          </label>
          <div className="text-sm font-bold w-full">
            Avatar {avatar && <span className="ml-1">{avatar}</span>}
            <div className="mt-1">
              <AvatarPicker value={avatar} onChange={setAvatar} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold pb-2.5">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            admin
          </label>
          <button
            onClick={async () => {
              const ok = await call("/api/admin/participants", { name, pin, avatar, isAdmin });
              if (ok) {
                setName("");
                setPin("");
                setAvatar("");
                setIsAdmin(false);
              }
            }}
            disabled={!name.trim() || pin.length !== 4}
            className="rounded-lg bg-pitch px-4 py-2 font-bold text-white hover:bg-pitch-dark transition disabled:opacity-40"
          >
            Criar
          </button>
        </div>
      </section>

      <section className="rounded-xl bg-white shadow divide-y divide-foreground/5">
        {people.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className="flex-1 font-bold">
              {p.avatar} {p.name} {p.isAdmin && <span className="text-xs text-gold">★ admin</span>}
            </span>
            <input
              placeholder="novo PIN"
              maxLength={4}
              value={resetPins[p.id] ?? ""}
              onChange={(e) =>
                setResetPins((r) => ({ ...r, [p.id]: e.target.value.replace(/\D/g, "") }))
              }
              className="w-24 rounded-lg border border-foreground/20 px-3 py-1.5 text-center"
            />
            {confirmReset[p.id] ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-red-600 font-bold">Confirmar?</span>
                <button
                  onClick={() => {
                    call("/api/admin/participants", { participantId: p.id, pin: resetPins[p.id] }, "PUT");
                    setConfirmReset((c) => ({ ...c, [p.id]: false }));
                  }}
                  className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-600 transition"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirmReset((c) => ({ ...c, [p.id]: false }))}
                  className="rounded-lg bg-foreground/10 px-3 py-1.5 text-sm font-bold hover:bg-foreground/20 transition"
                >
                  Não
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmReset((c) => ({ ...c, [p.id]: true }))}
                disabled={(resetPins[p.id] ?? "").length !== 4}
                className="rounded-lg bg-foreground/10 px-3 py-1.5 font-bold hover:bg-foreground/20 transition disabled:opacity-40"
              >
                Resetar PIN
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function ExtrasTab({
  extras,
  people,
  call,
}: {
  extras: ExtraPick[];
  people: Person[];
  call: (url: string, body?: unknown, method?: string) => Promise<boolean>;
}) {
  const personById = new Map(people.map((p) => [p.id, p]));
  const [points, setPoints] = useState<Record<string, string>>({});

  return (
    <div className="rounded-xl bg-white shadow divide-y divide-foreground/5">
      <p className="px-4 py-3 text-xs text-foreground/50">
        Ao fim da Copa, atribua os pontos bônus de cada palpite extra que acertou.
      </p>
      {extras.map((e) => {
        const key = `${e.participantId}:${e.category}`;
        const person = personById.get(e.participantId);
        return (
          <div key={key} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className="w-40 font-bold">
              {person?.avatar} {person?.name}
            </span>
            <span className="w-24 text-xs uppercase text-foreground/50">{e.category}</span>
            <span className="flex-1">{e.value}</span>
            <input
              type="number"
              min={0}
              value={points[key] ?? e.pointsAwarded.toString()}
              onChange={(ev) => setPoints((p) => ({ ...p, [key]: ev.target.value }))}
              className="w-16 rounded-lg border border-foreground/20 py-1.5 text-center"
            />
            <button
              onClick={() =>
                call("/api/admin/extras-award", {
                  participantId: e.participantId,
                  category: e.category,
                  points: parseInt(points[key] ?? e.pointsAwarded.toString(), 10),
                })
              }
              className="rounded-lg bg-pitch px-3 py-1.5 font-bold text-white hover:bg-pitch-dark transition"
            >
              Salvar
            </button>
          </div>
        );
      })}
      {extras.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-foreground/50">
          Nenhum palpite extra registrado ainda.
        </p>
      )}
    </div>
  );
}

function ConfigTab({
  championOpen,
  extrasOpen,
  championCode,
  teams,
  call,
}: {
  championOpen: boolean;
  extrasOpen: boolean;
  championCode: string | null;
  teams: Team[];
  call: (url: string, body?: unknown, method?: string) => Promise<boolean>;
}) {
  const [champ, setChamp] = useState(championCode ?? "");
  return (
    <div className="space-y-4 max-w-xl">
      <section className="rounded-xl bg-white p-6 shadow flex items-center justify-between gap-4">
        <div>
          <h2 className="font-black">Palpite de campeão</h2>
          <p className="text-xs text-foreground/50">
            Trave antes do início das oitavas (regra 3). Status:{" "}
            <b>{championOpen ? "aberto ✅" : "travado 🔒"}</b>
          </p>
        </div>
        <button
          onClick={() =>
            call("/api/admin/settings", {
              key: "champion_picks_open",
              value: championOpen ? "false" : "true",
            })
          }
          className="rounded-lg bg-pitch px-4 py-2 font-bold text-white hover:bg-pitch-dark transition"
        >
          {championOpen ? "Travar" : "Reabrir"}
        </button>
      </section>

      <section className="rounded-xl bg-white p-6 shadow flex items-center justify-between gap-4">
        <div>
          <h2 className="font-black">Palpites extras (artilheiro etc.)</h2>
          <p className="text-xs text-foreground/50">
            Status: <b>{extrasOpen ? "abertos ✅" : "travados 🔒"}</b>
          </p>
        </div>
        <button
          onClick={() =>
            call("/api/admin/settings", {
              key: "extra_picks_open",
              value: extrasOpen ? "false" : "true",
            })
          }
          className="rounded-lg bg-pitch px-4 py-2 font-bold text-white hover:bg-pitch-dark transition"
        >
          {extrasOpen ? "Travar" : "Reabrir"}
        </button>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="font-black mb-1">Campeão da Copa (resultado real)</h2>
        <p className="text-xs text-foreground/50 mb-3">
          Defina ao fim da Copa — quem acertou ganha +5. (Necessário porque a final pode
          ser decidida nos pênaltis.)
        </p>
        <div className="flex gap-3">
          <select
            value={champ}
            onChange={(e) => setChamp(e.target.value)}
            className="flex-1 rounded-lg border border-foreground/20 bg-white px-3 py-2"
          >
            <option value="">— ainda não definido —</option>
            {teams.map((t) => (
              <option key={t.code} value={t.code}>
                {t.flag} {t.name}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              call("/api/admin/settings", { key: "champion_code", value: champ })
            }
            className="rounded-lg bg-pitch px-4 py-2 font-bold text-white hover:bg-pitch-dark transition"
          >
            Salvar
          </button>
        </div>
      </section>
    </div>
  );
}
