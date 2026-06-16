import Link from "next/link";
import { getMatchesWithTeams, getStandings } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { duels, predictions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { dayKey, formatDay, formatKickoff, formatTime, STAGE_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const [allMatches, standings, myPreds, pendingDuelInvites] = await Promise.all([
    getMatchesWithTeams(),
    getStandings(),
    session
      ? db.select().from(predictions).where(eq(predictions.participantId, session.id))
      : Promise.resolve([]),
    session
      ? db
          .select()
          .from(duels)
          .where(and(eq(duels.challengedId, session.id), eq(duels.status, "pending")))
          .then((rows) => rows.length)
      : Promise.resolve(0),
  ]);

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const upcoming = allMatches.filter((m) => m.kickoff.getTime() > now).slice(0, 6);
  const recent = allMatches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.kickoff.getTime() - a.kickoff.getTime())
    .slice(0, 4);
  const predSet = new Set(myPreds.map((p) => p.matchNum));
  const missing = session
    ? upcoming.filter((m) => m.home && m.away && !predSet.has(m.num)).length
    : 0;
  const completed = allMatches.filter((m) => m.home && m.away && predSet.has(m.num)).length;
  const totalPalpitable = allMatches.filter((m) => m.home && m.away).length;
  const progressPct = totalPalpitable > 0 ? Math.round((completed / totalPalpitable) * 100) : 0;
  const me = session ? standings.find((s) => s.participantId === session.id) : null;
  const leader = standings[0];
  const todayKey = dayKey(new Date(now));
  const todayMatches = allMatches.filter((m) => m.home && m.away && dayKey(m.kickoff) === todayKey);
  const todayUpcoming = todayMatches.filter((m) => m.kickoff.getTime() > now);
  const todayFinished = todayMatches.filter((m) => m.status === "finished");
  const todayMissing = session
    ? todayUpcoming.filter((m) => !predSet.has(m.num))
    : [];
  const nextTodayMatch = todayUpcoming[0] ?? null;
  const todayHeadline = !todayMatches.length
    ? "Hoje esta mais leve: nenhum jogo da Copa no calendario."
    : todayUpcoming.length > 0
      ? `Ainda ha ${todayUpcoming.length} jogo${todayUpcoming.length > 1 ? "s" : ""} hoje.`
      : `Os ${todayFinished.length} jogo${todayFinished.length > 1 ? "s" : ""} de hoje ja foram encerrados.`;

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="hero-panel rounded-[1.75rem] p-5 text-white md:p-7">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-white/85">
                Copa 2026 • mobile-first
              </span>
              <h1 className="mt-3 text-3xl font-black leading-none sm:text-4xl">
                Seu bolão precisa responder rápido no celular.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/78 sm:text-base">
                Veja urgências, complete palpites e acompanhe a disputa da família sem
                perder tempo procurando informação.
              </p>
            </div>

            {session ? (
              <div className="glass-panel min-w-[170px] rounded-2xl px-4 py-3 text-sm text-foreground">
                <div className="text-foreground/55">Sua situação</div>
                <div className="mt-1 text-lg font-black">
                  {me ? `${me.avatar} ${me.rank}º lugar` : "Entrou agora"}
                </div>
                <div className="text-xs text-foreground/65">
                  {me ? `${me.points} pts até aqui` : "Comece pelos palpites"}
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-foreground">
                <div className="text-foreground/55">Acesso rápido</div>
                <div className="mt-1 font-black text-pitch-dark">Entre e comece a palpitar</div>
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr]">
            <div className="glass-panel rounded-3xl p-4 text-foreground">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-foreground/52">
                    Prioridade agora
                  </p>
                  <p className="mt-1 text-xl font-black text-pitch-dark">
                    {session
                      ? missing > 0
                        ? `${missing} jogo${missing > 1 ? "s" : ""} perto do apito sem palpite`
                        : "Tudo em dia para os próximos jogos"
                      : "Entre para acompanhar o bolão em tempo real"}
                  </p>
                </div>
                {leader && (
                  <div className="hidden rounded-2xl bg-white/55 px-3 py-2 text-right text-xs text-foreground/75 ring-1 ring-black/5 sm:block">
                    <div className="uppercase tracking-[0.16em] text-foreground/45">Líder</div>
                    <div className="mt-1 font-bold text-pitch-dark">
                      {leader.avatar} {leader.name}
                    </div>
                    <div>{leader.points} pts</div>
                  </div>
                )}
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-black/8">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-foreground/62">
                <span>{completed} palpites completos</span>
                <span>{progressPct}% do quadro já preenchido</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {session ? (
                  <>
                    <Link
                      href="/palpites"
                      className="rounded-full bg-gold px-5 py-2.5 text-sm font-black text-pitch-dark transition hover:brightness-110"
                    >
                      {missing > 0 ? "Completar palpites" : "Abrir palpites"}
                    </Link>
                    <Link
                      href="/meu-desempenho"
                      className="rounded-full border border-black/8 bg-white/65 px-5 py-2.5 text-sm font-bold text-pitch-dark transition hover:bg-white/82"
                    >
                      Ver meu desempenho
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full bg-gold px-5 py-2.5 text-sm font-black text-pitch-dark transition hover:brightness-110"
                  >
                    Entrar para palpitar
                  </Link>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="glass-panel rounded-2xl p-4 text-foreground">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/52">
                  Próximos jogos
                </div>
                <div className="mt-2 text-2xl font-black text-pitch-dark">{upcoming.length}</div>
                <p className="text-sm text-foreground/64">abertos para acompanhar agora</p>
              </div>
              <div className="glass-panel rounded-2xl p-4 text-foreground">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/52">
                  Ranking
                </div>
                <div className="mt-2 text-2xl font-black text-pitch-dark">{standings.length}</div>
                <p className="text-sm text-foreground/64">participantes na disputa</p>
              </div>
              <div className="glass-panel rounded-2xl p-4 text-foreground">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/52">
                  Rodada social
                </div>
                <div className="mt-2 text-base font-black text-pitch-dark">
                  Após o apito, todo mundo pode comparar os palpites.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[1.5rem] p-4 md:p-5">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Rodada do dia</span>
            <h2 className="mt-2 text-xl font-black">Hoje no bolao</h2>
          </div>
          <span className="rounded-full bg-pitch/8 px-3 py-1 text-xs font-black text-pitch-dark">
            {formatDay(new Date(now))}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(10,126,61,0.08),rgba(255,193,7,0.10))] p-4 ring-1 ring-black/5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-pitch/70">
              Painel rapido
            </p>
            <h3 className="mt-2 text-xl font-black text-pitch-dark">{todayHeadline}</h3>
            <p className="mt-2 text-sm text-foreground/62">
              {nextTodayMatch
                ? `Proximo apito: ${nextTodayMatch.home?.name} x ${nextTodayMatch.away?.name} as ${formatTime(nextTodayMatch.kickoff)}.`
                : todayMatches.length > 0
                  ? "Agora o foco e comparar o que cada um palpitou."
                  : "Use o tempo livre para revisar ranking, extras e desafios 1v1."}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-black/5">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-foreground/45">
                  Jogos
                </div>
                <div className="mt-1 text-2xl font-black text-pitch-dark">{todayMatches.length}</div>
              </div>
              <div className="rounded-2xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-black/5">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-foreground/45">
                  Sem palpite
                </div>
                <div className="mt-1 text-2xl font-black text-pitch-dark">
                  {session ? todayMissing.length : "?"}
                </div>
              </div>
              <div className="rounded-2xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-black/5">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-foreground/45">
                  Convites 1v1
                </div>
                <div className="mt-1 text-2xl font-black text-pitch-dark">{pendingDuelInvites}</div>
              </div>
              <div className="rounded-2xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-black/5">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-foreground/45">
                  Encerrados
                </div>
                <div className="mt-1 text-2xl font-black text-pitch-dark">{todayFinished.length}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={session ? "/palpites" : "/login"}
                className="rounded-full bg-gold px-5 py-2.5 text-sm font-black text-pitch-dark transition hover:brightness-110"
              >
                {session
                  ? todayMissing.length > 0
                    ? "Resolver rodada"
                    : "Abrir palpites"
                  : "Entrar para acompanhar"}
              </Link>
              {session && (
                <Link
                  href="/duelos"
                  className="rounded-full border border-black/8 bg-white/65 px-5 py-2.5 text-sm font-bold text-pitch-dark transition hover:bg-white/82"
                >
                  {pendingDuelInvites > 0
                    ? `Ver ${pendingDuelInvites} convite${pendingDuelInvites > 1 ? "s" : ""}`
                    : "Abrir 1v1"}
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {todayMatches.slice(0, 4).map((m) => {
              const hasPrediction = predSet.has(m.num);
              const started = m.kickoff.getTime() <= now;
              const statusLabel =
                m.status === "finished"
                  ? "encerrado"
                  : started
                    ? "ao vivo"
                    : session
                      ? hasPrediction
                        ? "ok"
                        : "faltando"
                      : "aberto";
              const statusClass =
                statusLabel === "faltando"
                  ? "bg-amber-100 text-amber-800"
                  : statusLabel === "ok"
                    ? "bg-emerald-100 text-emerald-800"
                    : statusLabel === "ao vivo"
                      ? "bg-pitch/10 text-pitch-dark"
                      : "bg-foreground/8 text-foreground/65";

              return (
                <div
                  key={m.num}
                  className="rounded-2xl border border-black/5 bg-white/72 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-black text-pitch-dark">
                      {m.home?.flag} {m.home?.name} x {m.away?.flag} {m.away?.name}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-foreground/55">
                    <span>
                      {STAGE_LABELS[m.stage]}
                      {m.group ? ` - Grupo ${m.group}` : ""}
                    </span>
                    <span>{formatKickoff(m.kickoff)}</span>
                  </div>
                </div>
              );
            })}
            {todayMatches.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/10 bg-white/65 p-4 text-sm text-foreground/60">
                Sem rodada hoje. O app pode respirar um pouco.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <section className="surface-card rounded-[1.5rem] p-4 md:p-5">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Agenda quente</span>
              <h2 className="mt-2 text-xl font-black">Próximos jogos</h2>
            </div>
            <Link href="/palpites" className="text-sm font-bold text-pitch underline underline-offset-4">
              abrir palpites
            </Link>
          </div>
          <div className="space-y-2.5">
            {upcoming.map((m) => (
              <div
                key={m.num}
                className="rounded-2xl border border-black/5 bg-white/72 px-4 py-3 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.16em] text-foreground/45">
                  <span>
                    {STAGE_LABELS[m.stage]}
                    {m.group ? ` • Grupo ${m.group}` : ""}
                  </span>
                  <span>Jogo {m.num}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-right font-bold">
                    {m.home ? `${m.home.name} ${m.home.flag}` : m.homePlaceholder}
                  </span>
                  <span className="rounded-full bg-foreground/6 px-3 py-1 text-[11px] font-bold whitespace-nowrap">
                    {formatKickoff(m.kickoff)}
                  </span>
                  <span className="flex-1 font-bold">
                    {m.away ? `${m.away.flag} ${m.away.name}` : m.awayPlaceholder}
                  </span>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="rounded-2xl border border-dashed border-black/10 bg-white/65 p-4 text-sm">
                A Copa acabou. Hora de cobrar os vencedores. 🎉
              </p>
            )}
          </div>
        </section>

        <section className="surface-card rounded-[1.5rem] p-4 md:p-5">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Corrida pelo topo</span>
              <h2 className="mt-2 text-xl font-black">Ranking ao vivo</h2>
            </div>
            <Link href="/classificacao" className="text-sm font-bold text-pitch underline underline-offset-4">
              ver tabela
            </Link>
          </div>

          <div className="space-y-2">
            {standings.slice(0, 6).map((s) => {
              const isMe = session?.id === s.participantId;
              return (
                <div
                  key={s.participantId}
                  className={`rounded-2xl px-4 py-3 ${
                    isMe
                      ? "bg-gold/14 ring-1 ring-gold/30"
                      : "bg-white/70 ring-1 ring-black/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center text-lg font-black">
                      {s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : s.rank === 3 ? "🥉" : `${s.rank}º`}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">
                        {s.avatar} {s.name} {isMe && <span className="text-pitch">(você)</span>}
                      </div>
                      <div className="text-xs text-foreground/50">
                        {s.exactCount} exatos • {s.resultCount} resultados
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-pitch-dark">{s.points}</div>
                      <div className="text-[11px] text-foreground/45">pts</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {recent.length > 0 && (
        <section className="surface-card rounded-[1.5rem] p-4 md:p-5">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Pós-jogo</span>
              <h2 className="mt-2 text-xl font-black">Últimos resultados</h2>
            </div>
            <span className="text-xs text-foreground/45">toque para comparar palpites</span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {recent.map((m) => (
              <Link
                key={m.num}
                href={`/jogo/${m.num}`}
                className="rounded-2xl border border-black/5 bg-white/72 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.16em] text-foreground/45">
                  <span>{STAGE_LABELS[m.stage]}</span>
                  <span>Comparar palpites</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-right font-bold">
                    {m.home?.name} {m.home?.flag}
                  </span>
                  <span className="rounded-full bg-pitch px-3 py-1 font-black text-white">
                    {m.homeScore} × {m.awayScore}
                  </span>
                  <span className="flex-1 font-bold">
                    {m.away?.flag} {m.away?.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
