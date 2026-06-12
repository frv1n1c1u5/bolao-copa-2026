import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { matches, participants, predictions, teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { formatKickoff, STAGE_LABELS } from "@/lib/format";
import { scorePrediction } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function JogoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const num = parseInt(id, 10);
  if (!Number.isInteger(num)) notFound();

  const [matchRows, allTeams, allPeople, preds, session] = await Promise.all([
    db.select().from(matches).where(eq(matches.num, num)),
    db.select().from(teams),
    db.select().from(participants),
    db.select().from(predictions).where(eq(predictions.matchNum, num)),
    getSession(),
  ]);
  const match = matchRows[0];
  if (!match) notFound();

  const teamByCode = new Map(allTeams.map((t) => [t.code, t]));
  const personById = new Map(allPeople.map((p) => [p.id, p]));
  const home = match.homeCode ? teamByCode.get(match.homeCode) : null;
  const away = match.awayCode ? teamByCode.get(match.awayCode) : null;
  // eslint-disable-next-line react-hooks/purity
  const started = Date.now() >= match.kickoff.getTime();
  const finished =
    match.status === "finished" && match.homeScore !== null && match.awayScore !== null;

  const visiblePreds = started ? preds : preds.filter((p) => p.participantId === session?.id);

  const rows = visiblePreds
    .map((p) => {
      const person = personById.get(p.participantId);
      const pts = finished
        ? scorePrediction(
            { home: p.homeScore, away: p.awayScore },
            { home: match.homeScore!, away: match.awayScore! }
          )
        : null;
      return { person, pred: p, pts, isMe: p.participantId === session?.id };
    })
    .sort((a, b) => {
      const ptsDiff = (b.pts ?? -1) - (a.pts ?? -1);
      if (ptsDiff !== 0) return ptsDiff;
      return Number(b.isMe) - Number(a.isMe);
    });

  const scoreGroups = started
    ? Array.from(
        visiblePreds.reduce((acc, p) => {
          const key = `${p.homeScore}×${p.awayScore}`;
          acc.set(key, (acc.get(key) ?? 0) + 1);
          return acc;
        }, new Map<string, number>())
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  const myPred = rows.find((row) => row.isMe);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/palpites" className="inline-flex text-sm font-bold text-pitch underline underline-offset-4">
        ← voltar aos palpites
      </Link>

      <section className="hero-panel rounded-[1.75rem] p-5 text-white md:p-6">
        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                {STAGE_LABELS[match.stage]}
                {match.group ? ` • Grupo ${match.group}` : ""} • Jogo {match.num}
              </p>
              <h1 className="mt-2 text-2xl font-black">Raio-x do jogo</h1>
              <p className="mt-2 text-sm text-white/74">{formatKickoff(match.kickoff)}</p>
            </div>

            <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-white">
              <div className="text-white/62">Modo social</div>
              <div className="mt-1 font-black">
                {started ? "Palpites liberados para comparação" : "Anti-cola ativo até o apito"}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] bg-white/10 px-4 py-5 backdrop-blur">
            <div className="flex items-center justify-center gap-4 text-center">
              <div className="min-w-0 flex-1 text-right">
                <div className="text-4xl">{home?.flag}</div>
                <div className="mt-2 text-base font-black">{home?.name ?? match.homePlaceholder}</div>
              </div>
              <div className="min-w-[86px]">
                <div className="rounded-2xl bg-white px-3 py-2 text-2xl font-black text-pitch-dark tabular-nums">
                  {finished ? `${match.homeScore} × ${match.awayScore}` : "×"}
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/58">
                  {finished ? "placar final" : "aguardando"}
                </div>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-4xl">{away?.flag}</div>
                <div className="mt-2 text-base font-black">{away?.name ?? match.awayPlaceholder}</div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-white/58">{match.venue}</p>
            {finished && match.stage !== "group" && (
              <p className="mt-1 text-center text-xs text-white/58">
                vale o placar dos 90 minutos para a pontuação do bolão
              </p>
            )}
          </div>
        </div>
      </section>

      {started && (
        <section className="surface-card rounded-[1.5rem] p-4 md:p-5">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Comparação destravada</span>
              <h2 className="mt-2 text-xl font-black">O que a rodada apostou</h2>
            </div>
            <span className="text-xs text-foreground/45">{visiblePreds.length} palpites visíveis</span>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl bg-[color:var(--header-bg)] px-4 py-4 text-white">
              <div className="text-xs uppercase tracking-[0.16em] text-white/58">Consenso da turma</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {scoreGroups.length > 0 ? (
                  scoreGroups.map(([score, count], index) => (
                    <div
                      key={score}
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        index === 0 ? "bg-gold text-pitch-dark" : "bg-white/10 text-white"
                      }`}
                    >
                      <div className="font-black">{score}</div>
                      <div className="text-[11px]">{count} pessoa{count > 1 ? "s" : ""}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-white/75">Ainda ninguém deixou palpite visível.</div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-gold/15 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-foreground/52">Seu recorte</div>
              {myPred ? (
                <>
                  <div className="mt-2 text-2xl font-black text-pitch-dark tabular-nums">
                    {myPred.pred.homeScore} × {myPred.pred.awayScore}
                  </div>
                  <p className="mt-1 text-sm text-foreground/65">
                    {finished
                      ? myPred.pts === 3
                        ? "Você cravou o placar."
                        : myPred.pts === 1
                        ? "Você acertou o resultado."
                        : "Seu palpite passou longe desta vez."
                      : "Agora já dá para comparar seu palpite com o resto da galera."}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-foreground/65">
                  Você não registrou palpite para este jogo.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="surface-card rounded-[1.5rem] p-4 md:p-5">
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              {started ? "Palpites abertos" : "Anti-cola ativo"}
            </span>
            <h2 className="mt-2 text-xl font-black">
              {started ? "Quem palpitou o quê" : "Seu palpite até o jogo começar"}
            </h2>
          </div>
          <span className="text-xs text-foreground/45">
            {started ? "liberado após o apito" : "os outros aparecem depois"}
          </span>
        </div>

        <div className="space-y-2">
          {rows.map(({ person, pred, pts, isMe }) => (
            <div
              key={pred.participantId}
              className={`rounded-2xl px-4 py-3 ${
                isMe ? "bg-gold/14 ring-1 ring-gold/30" : "bg-white/75 ring-1 ring-black/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">
                    {person?.avatar} {person?.name} {isMe && <span className="text-pitch">(você)</span>}
                  </div>
                  <div className="mt-0.5 text-xs text-foreground/48">
                    {started ? "palpite destravado para comparação" : "visível só para você por enquanto"}
                  </div>
                </div>
                <div className="rounded-2xl bg-[color:var(--header-bg)] px-3 py-2 text-base font-black text-white tabular-nums">
                  {pred.homeScore} × {pred.awayScore}
                </div>
                {pts !== null && (
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      pts === 3
                        ? "bg-gold text-pitch-dark"
                        : pts === 1
                        ? "bg-pitch/12 text-pitch"
                        : "bg-foreground/8 text-foreground/45"
                    }`}
                  >
                    {pts === 3 ? "🎯 +3" : pts === 1 ? "✓ +1" : "0 pts"}
                  </div>
                )}
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/70 px-4 py-6 text-center text-sm text-foreground/55">
              Nenhum palpite {started ? "foi registrado para este jogo." : "seu ainda."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
