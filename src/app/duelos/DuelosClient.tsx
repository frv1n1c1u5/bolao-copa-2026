"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DUEL_MARKETS, type DuelMarketKey, type DuelPicks } from "@/lib/duels";
import { formatKickoff } from "@/lib/format";
import type { MatchView } from "@/app/palpites/PredictionBoard";

interface Person {
  id: number;
  name: string;
  avatar: string;
}

interface DuelPlayer {
  id: string;
  name: string;
  team: "home" | "away";
}

interface PickView {
  picks: DuelPicks;
  points: number;
  submittedAt: string;
}

export interface DuelView {
  id: number;
  status: string;
  markets: DuelMarketKey[];
  winnerParticipantId: number | null;
  resultSummary: string | null;
  createdAt: string;
  acceptedAt: string | null;
  resolvedAt: string | null;
  challenger: Person;
  challenged: Person;
  match: MatchView | null;
  picks: Record<number, PickView>;
}

const MANDATORY: DuelMarketKey[] = DUEL_MARKETS.filter((m) => m.mandatory).map((m) => m.key);

export function DuelosClient({
  currentParticipantId,
  people,
  matches,
  duels,
}: {
  currentParticipantId: number;
  people: Person[];
  matches: MatchView[];
  duels: DuelView[];
}) {
  const router = useRouter();
  const [matchNum, setMatchNum] = useState(matches[0]?.num.toString() ?? "");
  const [challengedId, setChallengedId] = useState(people[0]?.id.toString() ?? "");
  const [markets, setMarkets] = useState<DuelMarketKey[]>([...MANDATORY]);
  const [picks, setPicks] = useState<DuelPicks>({});
  const [players, setPlayers] = useState<DuelPlayer[]>([]);
  const [playersMsg, setPlayersMsg] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedMatch = matches.find((m) => m.num.toString() === matchNum) ?? null;
  const needsPlayers = markets.includes("goal_scorer");

  useEffect(() => {
    if (!needsPlayers || !matchNum) {
      return;
    }
    let cancelled = false;
    fetch(`/api/duels/players?matchNum=${matchNum}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) {
          setPlayers(data.players ?? []);
          setPlayersMsg("");
        } else {
          setPlayers([]);
          setPlayersMsg(data.error ?? "Escalacao indisponivel");
        }
      })
      .catch(() => {
        if (!cancelled) setPlayersMsg("Falha ao carregar escalacao");
      });
    return () => {
      cancelled = true;
    };
  }, [needsPlayers, matchNum]);

  function toggleMarket(key: DuelMarketKey) {
    if (MANDATORY.includes(key)) return;
    setMarkets((current) =>
      current.includes(key) ? current.filter((m) => m !== key) : [...current, key]
    );
    setPicks((current) => {
      const next = { ...current };
      if (markets.includes(key)) delete next[key];
      return next;
    });
  }

  async function createDuel() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/duels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchNum: parseInt(matchNum, 10),
        challengedId: parseInt(challengedId, 10),
        markets,
        picks,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg("Duelo enviado.");
      setPicks({});
      router.refresh();
    } else {
      setMsg(data.error ?? "Erro ao criar duelo");
    }
  }

  const pendingForMe = duels.filter(
    (d) => d.status === "pending" && d.challenged.id === currentParticipantId
  );
  const active = duels.filter((d) => d.status === "accepted");
  const history = duels.filter((d) => d.status === "resolved" || d.status === "declined");
  const sentPending = duels.filter(
    (d) => d.status === "pending" && d.challenger.id === currentParticipantId
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="rounded-[1.5rem] bg-white p-4 shadow">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-pitch">Criar desafio</h2>
            <p className="text-xs text-foreground/55">
              Escolha o jogo de hoje, adversario e mercados do duelo.
            </p>
          </div>
          <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-black text-pitch-dark">
            1v1
          </span>
        </div>

        {matches.length === 0 ? (
          <p className="rounded-2xl bg-foreground/5 p-4 text-sm text-foreground/60">
            Nenhum jogo restante hoje para criar 1v1.
          </p>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm font-bold">
              Jogo
              <select
                value={matchNum}
                onChange={(e) => {
                  setMatchNum(e.target.value);
                  setPicks({});
                  setPlayers([]);
                  setPlayersMsg("");
                }}
                className="mt-1 w-full rounded-xl border border-foreground/15 bg-white px-3 py-3"
              >
                {matches.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.home?.name} x {m.away?.name} - {formatKickoff(new Date(m.kickoff))}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold">
              Adversario
              <select
                value={challengedId}
                onChange={(e) => setChallengedId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-foreground/15 bg-white px-3 py-3"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.avatar} {p.name}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <p className="mb-2 text-sm font-black">Mercados</p>
              <div className="grid gap-2">
                {DUEL_MARKETS.map((market) => {
                  const checked = markets.includes(market.key);
                  return (
                    <label
                      key={market.key}
                      className={`rounded-2xl border px-3 py-3 text-sm transition ${
                        checked ? "border-pitch bg-pitch/5" : "border-foreground/10 bg-white"
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={market.mandatory}
                          onChange={() => toggleMarket(market.key)}
                          className="mt-1"
                        />
                        <span>
                          <span className="font-black">
                            {market.label}{" "}
                            {market.mandatory && (
                              <span className="text-xs text-pitch/70">(obrigatorio)</span>
                            )}
                          </span>
                          <span className="block text-xs text-foreground/55">
                            {market.description}
                          </span>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {selectedMatch && (
              <PickForm
                markets={markets}
                match={selectedMatch}
                picks={picks}
                onChange={setPicks}
                players={players}
                playersMsg={playersMsg}
              />
            )}

            {msg && <p className="rounded-xl bg-foreground/5 px-3 py-2 text-sm font-bold">{msg}</p>}
            <button
              onClick={createDuel}
              disabled={busy || !matchNum || !challengedId || (needsPlayers && players.length === 0)}
              className="w-full rounded-2xl bg-pitch px-4 py-3 font-black text-white transition hover:bg-pitch-dark disabled:opacity-45"
            >
              {busy ? "Enviando..." : "Enviar desafio"}
            </button>
          </div>
        )}
      </section>

      <div className="space-y-4">
        <DuelSection title="Convites para voce" empty="Nenhum convite pendente.">
          {pendingForMe.map((duel) => (
            <DuelCard
              key={duel.id}
              duel={duel}
              currentParticipantId={currentParticipantId}
              mode="accept"
            />
          ))}
        </DuelSection>
        <DuelSection title="Aguardando resposta" empty="Nenhum desafio enviado pendente.">
          {sentPending.map((duel) => (
            <DuelCard key={duel.id} duel={duel} currentParticipantId={currentParticipantId} />
          ))}
        </DuelSection>
        <DuelSection title="Duelos ativos" empty="Nenhum duelo ativo.">
          {active.map((duel) => (
            <DuelCard
              key={duel.id}
              duel={duel}
              currentParticipantId={currentParticipantId}
              mode="resolve"
            />
          ))}
        </DuelSection>
        <DuelSection title="Historico" empty="Nenhum duelo encerrado ainda.">
          {history.map((duel) => (
            <DuelCard key={duel.id} duel={duel} currentParticipantId={currentParticipantId} />
          ))}
        </DuelSection>
      </div>
    </div>
  );
}

function DuelSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section>
      <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-pitch-dark">{title}</h2>
      <div className="space-y-3">
        {hasChildren ? children : <p className="rounded-2xl bg-white p-4 text-sm shadow">{empty}</p>}
      </div>
    </section>
  );
}

function PickForm({
  markets,
  match,
  picks,
  onChange,
  players,
  playersMsg,
}: {
  markets: DuelMarketKey[];
  match: MatchView;
  picks: DuelPicks;
  onChange: (picks: DuelPicks) => void;
  players: DuelPlayer[];
  playersMsg: string;
}) {
  function setPick(key: DuelMarketKey, value: string) {
    onChange({ ...picks, [key]: value });
  }

  return (
    <div className="rounded-2xl bg-foreground/[0.03] p-3">
      <p className="mb-2 text-sm font-black">Seus palpites do duelo</p>
      <div className="space-y-2">
        {markets.map((market) => (
          <label key={market} className="block text-xs font-bold text-foreground/70">
            {DUEL_MARKETS.find((m) => m.key === market)?.label}
            <MarketInput
              market={market}
              match={match}
              value={picks[market] ? String(picks[market]) : ""}
              onChange={(value) => setPick(market, value)}
              players={players}
              playersMsg={playersMsg}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function MarketInput({
  market,
  match,
  value,
  onChange,
  players,
  playersMsg,
}: {
  market: DuelMarketKey;
  match: MatchView;
  value: string;
  onChange: (value: string) => void;
  players: DuelPlayer[];
  playersMsg: string;
}) {
  if (["possession", "total_shots", "shots_on_target", "corners", "cards"].includes(market)) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-foreground/15 bg-white px-3 py-2 text-sm">
        <option value="">Escolha</option>
        <option value="home">{match.home?.flag} {match.home?.name}</option>
        <option value="away">{match.away?.flag} {match.away?.name}</option>
        <option value="draw">Empate</option>
      </select>
    );
  }
  if (market === "first_goal_team") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-foreground/15 bg-white px-3 py-2 text-sm">
        <option value="">Escolha</option>
        <option value="home">{match.home?.flag} {match.home?.name}</option>
        <option value="away">{match.away?.flag} {match.away?.name}</option>
        <option value="none">Nao tera gol</option>
      </select>
    );
  }
  if (market === "first_half_goal") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-foreground/15 bg-white px-3 py-2 text-sm">
        <option value="">Escolha</option>
        <option value="yes">Sim</option>
        <option value="no">Nao</option>
      </select>
    );
  }
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-foreground/15 bg-white px-3 py-2 text-sm">
      <option value="">{playersMsg || "Escolha um jogador"}</option>
      {players.map((player) => (
        <option key={player.id} value={player.id}>
          {player.team === "home" ? match.home?.flag : match.away?.flag} {player.name}
        </option>
      ))}
    </select>
  );
}

function DuelCard({
  duel,
  currentParticipantId,
  mode,
}: {
  duel: DuelView;
  currentParticipantId: number;
  mode?: "accept" | "resolve";
}) {
  const router = useRouter();
  const [picks, setPicks] = useState<DuelPicks>({});
  const [players, setPlayers] = useState<DuelPlayer[]>([]);
  const [playersMsg, setPlayersMsg] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());
  const locked = duel.match ? now >= new Date(duel.match.kickoff).getTime() : false;
  const mine = duel.picks[currentParticipantId];
  const opponent =
    duel.challenger.id === currentParticipantId ? duel.challenged : duel.challenger;

  const needsPlayers = duel.markets.includes("goal_scorer");
  useEffect(() => {
    if (mode !== "accept" || !needsPlayers || !duel.match) return;
    let cancelled = false;
    fetch(`/api/duels/players?matchNum=${duel.match.num}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) {
          setPlayers(data.players ?? []);
          setPlayersMsg("");
        } else {
          setPlayersMsg(data.error ?? "Escalacao indisponivel");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, needsPlayers, duel.match]);

  async function post(action: "accept" | "decline" | "resolve") {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/duels/${duel.id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: action === "accept" ? JSON.stringify({ picks }) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setMsg(data.error ?? "Erro no duelo");
    }
  }

  return (
    <article className="rounded-[1.35rem] bg-white p-4 shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-pitch/70">
            {duel.status === "pending" ? "Convite pendente" : duel.status === "accepted" ? "Ativo" : duel.status === "resolved" ? "Resolvido" : "Recusado"}
          </p>
          <h3 className="mt-1 font-black">
            {duel.challenger.avatar} {duel.challenger.name} x {duel.challenged.avatar} {duel.challenged.name}
          </h3>
          {duel.match && (
            <p className="mt-1 text-xs text-foreground/55">
              Jogo {duel.match.num}: {duel.match.home?.name} x {duel.match.away?.name} - {formatKickoff(new Date(duel.match.kickoff))}
            </p>
          )}
        </div>
        <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-bold">
          {duel.markets.length} mercados
        </span>
      </div>

      {mode === "accept" && duel.match && !locked && (
        <div className="mt-3">
          <PickForm
            markets={duel.markets}
            match={duel.match}
            picks={picks}
            onChange={setPicks}
            players={players}
            playersMsg={playersMsg}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => post("accept")}
              disabled={busy || (needsPlayers && players.length === 0)}
              className="flex-1 rounded-xl bg-pitch px-3 py-2 text-sm font-black text-white disabled:opacity-45"
            >
              Aceitar
            </button>
            <button
              onClick={() => post("decline")}
              disabled={busy}
              className="rounded-xl bg-foreground/10 px-3 py-2 text-sm font-black"
            >
              Recusar
            </button>
          </div>
        </div>
      )}

      {duel.status === "accepted" && (
        <div className="mt-3 rounded-2xl bg-pitch/5 p-3 text-sm">
          {!locked ? (
            <p className="font-bold text-pitch-dark">Palpites travam no apito inicial.</p>
          ) : (
            <PicksPreview duel={duel} currentParticipantId={currentParticipantId} />
          )}
          {mode === "resolve" && duel.match?.status === "finished" && (
            <button
              onClick={() => post("resolve")}
              disabled={busy}
              className="mt-3 w-full rounded-xl bg-gold px-3 py-2 text-sm font-black text-pitch-dark disabled:opacity-45"
            >
              Apurar pela ESPN
            </button>
          )}
        </div>
      )}

      {duel.status === "resolved" && (
        <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-950">
          {duel.winnerParticipantId ? (
            <b>Vencedor: {duel.winnerParticipantId === currentParticipantId ? "voce" : opponent.name}</b>
          ) : (
            <b>Empate no duelo.</b>
          )}
          <PicksPreview duel={duel} currentParticipantId={currentParticipantId} />
        </div>
      )}

      {mine && (
        <p className="mt-2 text-xs text-foreground/50">
          Seus pontos neste duelo: <b>{mine.points}</b>
        </p>
      )}
      {msg && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{msg}</p>}
    </article>
  );
}

function PicksPreview({
  duel,
}: {
  duel: DuelView;
  currentParticipantId: number;
}) {
  const entries = Object.entries(duel.picks);
  return (
    <div className="mt-2 space-y-1 text-xs">
      {entries.map(([participantId, pick]) => {
        const person =
          Number(participantId) === duel.challenger.id ? duel.challenger : duel.challenged;
        return (
          <div key={participantId} className="rounded-xl bg-white/70 px-3 py-2">
            <b>{person.avatar} {person.name}</b>: {pick.points} pts
          </div>
        );
      })}
    </div>
  );
}
