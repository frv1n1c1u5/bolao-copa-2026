import { db } from "@/db";
import { matches, participants, predictions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scorePrediction } from "@/lib/scoring";
import { StatsCharts } from "./StatsCharts";

export const dynamic = "force-dynamic";

export default async function EstatisticasPage() {
  const [allPeople, allPreds, finished] = await Promise.all([
    db.select().from(participants),
    db.select().from(predictions),
    db.select().from(matches).where(eq(matches.status, "finished")),
  ]);

  const finishedSorted = finished
    .filter((m) => m.homeScore !== null && m.awayScore !== null)
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());

  const predByKey = new Map(
    allPreds.map((p) => [`${p.participantId}:${p.matchNum}`, p])
  );

  // Série de evolução: pontos acumulados por participante a cada jogo encerrado.
  const cumulative = new Map<number, number>(allPeople.map((p) => [p.id, 0]));
  const series = finishedSorted.map((m) => {
    const point: Record<string, number | string> = { jogo: `J${m.num}` };
    for (const p of allPeople) {
      const pred = predByKey.get(`${p.id}:${m.num}`);
      if (pred) {
        const pts = scorePrediction(
          { home: pred.homeScore, away: pred.awayScore },
          { home: m.homeScore!, away: m.awayScore! }
        );
        cumulative.set(p.id, (cumulative.get(p.id) ?? 0) + pts);
      }
      point[p.name] = cumulative.get(p.id) ?? 0;
    }
    return point;
  });

  // Aproveitamento e curiosidades.
  const stats = allPeople.map((p) => {
    let exact = 0,
      result = 0,
      miss = 0,
      played = 0,
      streak = 0,
      bestStreak = 0;
    for (const m of finishedSorted) {
      const pred = predByKey.get(`${p.id}:${m.num}`);
      if (!pred) continue;
      played++;
      const pts = scorePrediction(
        { home: pred.homeScore, away: pred.awayScore },
        { home: m.homeScore!, away: m.awayScore! }
      );
      if (pts === 3) exact++;
      else if (pts === 1) result++;
      else miss++;
      streak = pts > 0 ? streak + 1 : 0;
      bestStreak = Math.max(bestStreak, streak);
    }
    const points = exact * 3 + result;
    return {
      name: p.name,
      avatar: p.avatar,
      played,
      exact,
      result,
      miss,
      points,
      pct: played > 0 ? Math.round((points / (played * 3)) * 100) : 0,
      bestStreak,
      currentStreak: streak,
    };
  });

  const withGames = stats.filter((s) => s.played >= 3);
  const peQuente = withGames.length
    ? withGames.reduce((a, b) => (b.pct > a.pct ? b : a))
    : null;
  const peFrio = withGames.length
    ? withGames.reduce((a, b) => (b.pct < a.pct ? b : a))
    : null;

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">📊 Estatísticas</h1>

      {finishedSorted.length === 0 ? (
        <p className="rounded-xl bg-white p-6 shadow text-sm">
          As estatísticas aparecem depois dos primeiros jogos encerrados. ⏳
        </p>
      ) : (
        <div className="space-y-8">
          {(peQuente || peFrio) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {peQuente && (
                <div className="rounded-xl bg-white p-4 shadow">
                  <div className="text-xs uppercase tracking-wide text-foreground/50">
                    🔥 Pé quente (melhor aproveitamento)
                  </div>
                  <div className="mt-1 text-lg font-black">
                    {peQuente.avatar} {peQuente.name} — {peQuente.pct}%
                  </div>
                </div>
              )}
              {peFrio && peFrio !== peQuente && (
                <div className="rounded-xl bg-white p-4 shadow">
                  <div className="text-xs uppercase tracking-wide text-foreground/50">
                    🧊 Pé frio (zoeira liberada)
                  </div>
                  <div className="mt-1 text-lg font-black">
                    {peFrio.avatar} {peFrio.name} — {peFrio.pct}%
                  </div>
                </div>
              )}
            </div>
          )}

          <StatsCharts series={series} names={allPeople.map((p) => p.name)} />

          <section>
            <h2 className="mb-2 text-lg font-black">Aproveitamento</h2>
            <div className="overflow-x-auto rounded-xl bg-white shadow">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
                    <th className="px-4 py-3">Participante</th>
                    <th className="px-4 py-3 text-center">Palpites pontuados</th>
                    <th className="px-4 py-3 text-center">🎯 Exatos</th>
                    <th className="px-4 py-3 text-center">✓ Resultados</th>
                    <th className="px-4 py-3 text-center">✗ Erros</th>
                    <th className="px-4 py-3 text-center">Aproveitamento</th>
                    <th className="px-4 py-3 text-center">Melhor sequência</th>
                  </tr>
                </thead>
                <tbody>
                  {stats
                    .sort((a, b) => b.pct - a.pct)
                    .map((s) => (
                      <tr key={s.name} className="border-b border-foreground/5">
                        <td className="px-4 py-2.5 font-bold">
                          {s.avatar} {s.name}
                        </td>
                        <td className="px-4 py-2.5 text-center">{s.played}</td>
                        <td className="px-4 py-2.5 text-center">{s.exact}</td>
                        <td className="px-4 py-2.5 text-center">{s.result}</td>
                        <td className="px-4 py-2.5 text-center">{s.miss}</td>
                        <td className="px-4 py-2.5 text-center font-black text-pitch-dark">
                          {s.pct}%
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {s.bestStreak} {s.currentStreak >= 3 ? "🔥" : ""}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
