import Link from "next/link";
import { getMatchesWithTeams, getStandings } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatKickoff, STAGE_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const [allMatches, standings, myPreds] = await Promise.all([
    getMatchesWithTeams(),
    getStandings(),
    session
      ? db.select().from(predictions).where(eq(predictions.participantId, session.id))
      : Promise.resolve([]),
  ]);

  const now = Date.now();
  const upcoming = allMatches
    .filter((m) => m.kickoff.getTime() > now)
    .slice(0, 6);
  const recent = allMatches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.kickoff.getTime() - a.kickoff.getTime())
    .slice(0, 4);
  const predSet = new Set(myPreds.map((p) => p.matchNum));
  const missing = session
    ? upcoming.filter((m) => m.home && m.away && !predSet.has(m.num)).length
    : 0;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-pitch text-white p-6 shadow-lg">
        <h1 className="text-3xl font-black">🏆 Bolão da Família</h1>
        <p className="mt-1 text-white/80">
          Copa do Mundo 2026 · 104 jogos · 48 seleções · zoeira liberada
        </p>
        {session ? (
          missing > 0 ? (
            <Link
              href="/palpites"
              className="mt-4 inline-block rounded-full bg-gold px-5 py-2 font-bold text-pitch-dark hover:brightness-110 transition"
            >
              ⚠️ Você tem {missing} jogo{missing > 1 ? "s" : ""} próximo
              {missing > 1 ? "s" : ""} sem palpite!
            </Link>
          ) : (
            <Link
              href="/palpites"
              className="mt-4 inline-block rounded-full bg-white/20 px-5 py-2 font-bold hover:bg-white/30 transition"
            >
              Ver meus palpites →
            </Link>
          )
        ) : (
          <Link
            href="/login"
            className="mt-4 inline-block rounded-full bg-gold px-5 py-2 font-bold text-pitch-dark hover:brightness-110 transition"
          >
            Entrar para palpitar →
          </Link>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-black">Próximos jogos</h2>
          <div className="space-y-2">
            {upcoming.map((m) => (
              <div key={m.num} className="rounded-xl bg-white p-3 shadow text-sm flex items-center gap-2">
                <span className="flex-1 text-right font-bold">
                  {m.home ? `${m.home.name} ${m.home.flag}` : m.homePlaceholder}
                </span>
                <span className="rounded bg-foreground/5 px-2 py-1 text-xs whitespace-nowrap">
                  {formatKickoff(m.kickoff)}
                </span>
                <span className="flex-1 font-bold">
                  {m.away ? `${m.away.flag} ${m.away.name}` : m.awayPlaceholder}
                </span>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="rounded-xl bg-white p-4 shadow text-sm">A Copa acabou! 🎉</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-black">Classificação</h2>
          <div className="rounded-xl bg-white shadow divide-y divide-foreground/5">
            {standings.slice(0, 8).map((s) => (
              <div key={s.participantId} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-7 font-black">
                  {s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : s.rank === 3 ? "🥉" : `${s.rank}º`}
                </span>
                <span className="flex-1 font-bold">
                  {s.avatar} {s.name}
                </span>
                <span className="font-black text-pitch-dark">{s.points} pts</span>
              </div>
            ))}
            {standings.length === 0 && (
              <p className="p-4 text-sm text-foreground/50">Nenhum participante ainda.</p>
            )}
          </div>
          <Link href="/classificacao" className="mt-2 inline-block text-sm text-pitch underline">
            tabela completa →
          </Link>
        </section>
      </div>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-black">Últimos resultados</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {recent.map((m) => (
              <Link
                key={m.num}
                href={`/jogo/${m.num}`}
                className="rounded-xl bg-white p-3 shadow text-sm flex items-center gap-2 hover:shadow-md transition"
              >
                <span className="flex-1 text-right font-bold">
                  {m.home?.name} {m.home?.flag}
                </span>
                <span className="rounded bg-pitch px-2 py-1 font-black text-white">
                  {m.homeScore} × {m.awayScore}
                </span>
                <span className="flex-1 font-bold">
                  {m.away?.flag} {m.away?.name}
                </span>
                <span className="text-xs text-foreground/40">{STAGE_LABELS[m.stage]}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
