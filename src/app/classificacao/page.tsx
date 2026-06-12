import { getStandings, getChampionCode } from "@/lib/queries";
import { db } from "@/db";
import { championPicks, teams, badges } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { BADGE_META } from "@/lib/badges";
import { RankingShare } from "@/components/RankingShare";
import type { ParticipantTally } from "@/lib/scoring";

export const dynamic = "force-dynamic";

function tiebreakLabel(curr: ParticipantTally, prev: ParticipantTally): string | null {
  if (curr.points !== prev.points) return null; // não empatados
  if (curr.exactCount !== prev.exactCount) return "placares exatos";
  if (curr.resultCount !== prev.resultCount) return "resultados corretos";
  if (curr.championHit !== prev.championHit) return "acertou o campeão";
  return null;
}

export default async function ClassificacaoPage() {
  const session = await getSession();
  const [standings, champPicks, allTeams, championCode, allBadges] = await Promise.all([
    getStandings(),
    db.select().from(championPicks),
    db.select().from(teams),
    getChampionCode(),
    db.select().from(badges),
  ]);
  const teamByCode = new Map(allTeams.map((t) => [t.code, t]));
  const pickByParticipant = new Map(champPicks.map((c) => [c.participantId, c.teamCode]));

  // badges por participante: tipo → contagem
  const badgesByParticipant = new Map<number, Map<string, number>>();
  for (const b of allBadges) {
    if (!badgesByParticipant.has(b.participantId)) {
      badgesByParticipant.set(b.participantId, new Map());
    }
    const m = badgesByParticipant.get(b.participantId)!;
    m.set(b.badgeType, (m.get(b.badgeType) ?? 0) + 1);
  }

  const medal = (rank: number) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}º`;

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="text-2xl font-black">Classificação</h1>
        <RankingShare standings={standings} />
      </div>
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
              <th className="px-4 py-3 text-center" title="Pontos">Pts</th>
              <th className="px-4 py-3 text-center" title="Placares exatos (3 pts)">🎯 Exatos</th>
              <th className="px-4 py-3 text-center" title="Resultados corretos (1 pt)">✓ Resultados</th>
              <th className="px-4 py-3 text-center" title="Pontos de bolões extras">⭐ Extras</th>
              <th className="px-4 py-3">Campeão</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const pick = pickByParticipant.get(s.participantId);
              const pickTeam = pick ? teamByCode.get(pick) : null;
              const isMe = session?.id === s.participantId;
              const prev = standings[i - 1];
              const tieLabel = prev ? tiebreakLabel(s, prev) : null;
              const myBadges = badgesByParticipant.get(s.participantId);

              return (
                <>
                  {tieLabel && (
                    <tr key={`tie-${s.participantId}`}>
                      <td
                        colSpan={7}
                        className="px-4 py-1 text-xs text-center text-foreground/40 italic bg-foreground/5"
                      >
                        desempate por {tieLabel} ↑
                      </td>
                    </tr>
                  )}
                  <tr
                    key={s.participantId}
                    className={`border-b border-foreground/5 ${isMe ? "bg-gold/10" : ""}`}
                  >
                    <td className="px-4 py-3 font-black">{medal(s.rank)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">
                          {s.avatar} {s.name}
                          {isMe && <span className="ml-1 text-xs text-pitch">(você)</span>}
                        </span>
                        {myBadges && (
                          <span className="flex gap-0.5">
                            {[...myBadges.entries()].map(([type, count]) => {
                              const meta = BADGE_META[type];
                              return (
                                <span
                                  key={type}
                                  title={`${meta.label}: ${meta.desc}${count > 1 ? ` (×${count})` : ""}`}
                                  className="cursor-help"
                                >
                                  {meta.icon}
                                  {count > 1 && (
                                    <sup className="text-[10px] font-bold">{count}</sup>
                                  )}
                                </span>
                              );
                            })}
                          </span>
                        )}
                      </div>
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
                </>
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

      {Object.entries(BADGE_META).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-foreground/60">
          {Object.entries(BADGE_META).map(([, meta]) => (
            <span key={meta.label}>
              {meta.icon} <b>{meta.label}</b> — {meta.desc}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
