import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { predictions, badges, championPicks, teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStandings, getChampionCode, getMatchesWithTeams } from "@/lib/queries";
import { scorePrediction } from "@/lib/scoring";
import { BADGE_META } from "@/lib/badges";
import Link from "next/link";

export const dynamic = "force-dynamic";

function rankLabel(r: number) {
  return r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `${r}º`;
}

export default async function MeuDesempenhoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [standings, allMatches, myPreds, myBadges, myChampPick, allTeams, championCode] =
    await Promise.all([
      getStandings(),
      getMatchesWithTeams(),
      db.select().from(predictions).where(eq(predictions.participantId, session.id)),
      db.select().from(badges).where(eq(badges.participantId, session.id)),
      db.select().from(championPicks).where(eq(championPicks.participantId, session.id)),
      db.select().from(teams),
      getChampionCode(),
    ]);

  const me = standings.find((s) => s.participantId === session.id);
  const predMap = new Map(myPreds.map((p) => [p.matchNum, p]));
  const teamByCode = new Map(allTeams.map((t) => [t.code, t]));
  const champTeam = myChampPick[0] ? teamByCode.get(myChampPick[0].teamCode) : null;

  const finishedMatches = allMatches
    .filter((m) => m.status === "finished" && m.homeScore !== null && m.home && m.away)
    .sort((a, b) => b.kickoff.getTime() - a.kickoff.getTime());

  const pendingMatches = allMatches
    .filter(
      (m) =>
        m.status !== "finished" &&
        m.home &&
        m.away &&
        new Date(m.kickoff) > new Date() &&
        !predMap.has(m.num)
    )
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime())
    .slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black">Meu Desempenho</h1>

      {/* Card de posição */}
      {me ? (
        <div className="rounded-xl bg-white shadow p-5 flex items-center gap-4">
          <div className="text-5xl leading-none">{me.avatar}</div>
          <div className="flex-1">
            <div className="font-black text-lg leading-tight">{me.name}</div>
            <div className="text-sm text-foreground/60 mt-0.5">
              {rankLabel(me.rank)} lugar entre {standings.length} participantes
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-pitch-dark">{me.points}</div>
            <div className="text-xs text-foreground/50 mt-0.5">pontos</div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow p-5 text-foreground/50 text-sm">
          Nenhum palpite registrado ainda.
        </div>
      )}

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white shadow p-4 text-center">
          <div className="text-2xl font-black text-pitch-dark">{me?.exactCount ?? 0}</div>
          <div className="text-xs text-foreground/60 mt-0.5">🎯 Placares exatos</div>
        </div>
        <div className="rounded-xl bg-white shadow p-4 text-center">
          <div className="text-2xl font-black text-blue-600">{me?.resultCount ?? 0}</div>
          <div className="text-xs text-foreground/60 mt-0.5">✓ Resultados certos</div>
        </div>
        <div className="rounded-xl bg-white shadow p-4 text-center">
          <div className="text-2xl font-black text-gold">{me?.extraPoints ?? 0}</div>
          <div className="text-xs text-foreground/60 mt-0.5">⭐ Pts extras</div>
        </div>
      </div>

      {/* Campeão */}
      <div className="rounded-xl bg-white shadow p-4 flex items-center gap-3">
        <span className="text-2xl">🏆</span>
        <div className="flex-1">
          <div className="text-sm font-bold text-foreground/70">Palpite de Campeão</div>
          <div className="font-medium mt-0.5">
            {champTeam ? `${champTeam.flag} ${champTeam.name}` : "Não indicado ainda"}
          </div>
        </div>
        {me?.championHit ? (
          <span className="rounded-full bg-pitch/10 text-pitch font-bold text-sm px-2.5 py-1">
            ✅ +5 pts
          </span>
        ) : championCode && myChampPick[0] ? (
          <span className="text-sm text-foreground/40">❌ Não acertou</span>
        ) : myChampPick[0] ? (
          <span className="text-sm text-foreground/40">⏳ Aguardando final</span>
        ) : null}
      </div>

      {/* Badges */}
      {myBadges.length > 0 && (
        <div>
          <h2 className="text-lg font-black mb-3">Conquistas</h2>
          <div className="flex flex-wrap gap-3">
            {myBadges.map((b, i) => {
              const meta = BADGE_META[b.badgeType];
              if (!meta) return null;
              return (
                <div key={i} className="rounded-xl bg-white shadow px-4 py-3 flex items-center gap-2">
                  <span className="text-2xl leading-none">{meta.icon}</span>
                  <div>
                    <div className="font-bold text-sm">{meta.label}</div>
                    <div className="text-xs text-foreground/50">{meta.desc} · Rodada {b.gameWeek}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Palpites pendentes */}
      {pendingMatches.length > 0 && (
        <div>
          <h2 className="text-lg font-black mb-3 text-amber-600">⚠️ Palpites pendentes</h2>
          <div className="rounded-xl bg-amber-50 border border-amber-200 overflow-hidden">
            {pendingMatches.map((m) => (
              <Link
                key={m.num}
                href="/palpites"
                className="flex items-center gap-3 px-4 py-3 border-b border-amber-100 last:border-0 hover:bg-amber-100 transition"
              >
                <span className="flex-1 text-sm font-medium">
                  {m.home!.flag} {m.home!.name} × {m.away!.flag} {m.away!.name}
                </span>
                <span className="text-xs text-amber-700">
                  {new Date(m.kickoff).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </Link>
            ))}
            {pendingMatches.length === 5 && (
              <Link
                href="/palpites?filtro=sem-palpite"
                className="block px-4 py-2.5 text-xs text-center text-amber-700 font-medium hover:bg-amber-100 transition"
              >
                Ver todos os palpites pendentes →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Histórico de palpites */}
      <div>
        <h2 className="text-lg font-black mb-3">Histórico de Palpites</h2>
        <div className="rounded-xl bg-white shadow overflow-hidden">
          {finishedMatches.length === 0 && (
            <div className="px-4 py-8 text-center text-foreground/50 text-sm">
              Nenhum jogo finalizado ainda.
            </div>
          )}
          {finishedMatches.map((m) => {
            const pred = predMap.get(m.num);
            let pts = 0;
            let resultType: "exact" | "result" | "miss" | "none" = "none";
            if (pred) {
              pts = scorePrediction(
                { home: pred.homeScore, away: pred.awayScore },
                { home: m.homeScore!, away: m.awayScore! }
              );
              resultType = pts === 3 ? "exact" : pts === 1 ? "result" : "miss";
            }

            const badge =
              resultType === "exact"
                ? "bg-pitch text-white"
                : resultType === "result"
                  ? "bg-blue-500 text-white"
                  : resultType === "miss"
                    ? "bg-foreground/10 text-foreground/40"
                    : "bg-foreground/5 text-foreground/30";

            return (
              <div
                key={m.num}
                className="flex items-center gap-3 px-4 py-3 border-b border-foreground/5 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {m.home!.flag} {m.home!.name}{" "}
                    <span className="font-black">{m.homeScore}–{m.awayScore}</span>{" "}
                    {m.away!.flag} {m.away!.name}
                  </div>
                  <div className="text-xs text-foreground/50 mt-0.5">
                    {pred ? `Palpite: ${pred.homeScore}–${pred.awayScore}` : "Sem palpite"}
                    {" · "}
                    {new Date(m.kickoff).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>
                </div>
                <div className={`rounded-full px-2.5 py-1 text-xs font-bold shrink-0 ${badge}`}>
                  {resultType === "exact"
                    ? "🎯 3 pts"
                    : resultType === "result"
                      ? "✓ 1 pt"
                      : resultType === "miss"
                        ? "✗ 0 pts"
                        : "— s/p"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
