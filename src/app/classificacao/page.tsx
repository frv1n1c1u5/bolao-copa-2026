import { getStandings, getChampionCode } from "@/lib/queries";
import { db } from "@/db";
import { championPicks, teams } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClassificacaoPage() {
  const session = await getSession();
  const [standings, champPicks, allTeams, championCode] = await Promise.all([
    getStandings(),
    db.select().from(championPicks),
    db.select().from(teams),
    getChampionCode(),
  ]);
  const teamByCode = new Map(allTeams.map((t) => [t.code, t]));
  const pickByParticipant = new Map(champPicks.map((c) => [c.participantId, c.teamCode]));

  const medal = (rank: number) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}º`;

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">Classificação</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Desempate: placares exatos → resultados corretos → campeão.
        {championCode && (
          <>
            {" "}
            Campeão: {teamByCode.get(championCode)?.flag}{" "}
            <b>{teamByCode.get(championCode)?.name}</b>
          </>
        )}
      </p>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Participante</th>
              <th className="px-4 py-3 text-center" title="Pontos">
                Pts
              </th>
              <th className="px-4 py-3 text-center" title="Placares exatos (3 pts)">
                🎯 Exatos
              </th>
              <th className="px-4 py-3 text-center" title="Resultados corretos (1 pt)">
                ✓ Resultados
              </th>
              <th className="px-4 py-3 text-center" title="Pontos de bolões extras">
                ⭐ Extras
              </th>
              <th className="px-4 py-3">Campeão</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => {
              const pick = pickByParticipant.get(s.participantId);
              const pickTeam = pick ? teamByCode.get(pick) : null;
              const isMe = session?.id === s.participantId;
              return (
                <tr
                  key={s.participantId}
                  className={`border-b border-foreground/5 ${isMe ? "bg-gold/10" : ""}`}
                >
                  <td className="px-4 py-3 font-black">{medal(s.rank)}</td>
                  <td className="px-4 py-3 font-bold">
                    {s.avatar} {s.name}
                    {isMe && <span className="ml-1 text-xs text-pitch">(você)</span>}
                  </td>
                  <td className="px-4 py-3 text-center font-black text-pitch-dark text-base">
                    {s.points}
                  </td>
                  <td className="px-4 py-3 text-center">{s.exactCount}</td>
                  <td className="px-4 py-3 text-center">{s.resultCount}</td>
                  <td className="px-4 py-3 text-center">{s.extraPoints}</td>
                  <td className="px-4 py-3">
                    {pickTeam ? (
                      <span className={s.championHit ? "font-bold text-pitch" : ""}>
                        {pickTeam.flag} {pickTeam.name}
                        {s.championHit && " +5"}
                      </span>
                    ) : (
                      <span className="text-foreground/30">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {standings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-foreground/50">
                  Nenhum participante ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
