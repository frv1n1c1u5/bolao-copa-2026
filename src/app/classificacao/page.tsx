import { getStandings, getChampionCode } from "@/lib/queries";
import { db } from "@/db";
import { championPicks, teams, badges, matches } from "@/db/schema";
import { ne } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { BADGE_META } from "@/lib/badges";
import { RankingShare } from "@/components/RankingShare";
import type { ParticipantTally } from "@/lib/scoring";

export const dynamic = "force-dynamic";

function tiebreakLabel(curr: ParticipantTally, prev: ParticipantTally): string | null {
  if (curr.points !== prev.points) return null;
  if (curr.exactCount !== prev.exactCount) return "placares exatos";
  if (curr.resultCount !== prev.resultCount) return "resultados corretos";
  if (curr.championHit !== prev.championHit) return "acertou o campeão";
  return null;
}

export default async function ClassificacaoPage() {
  const session = await getSession();
  const [standings, champPicks, allTeams, championCode, allBadges, allMatchStatuses] =
    await Promise.all([
      getStandings(),
      db.select().from(championPicks),
      db.select().from(teams),
      getChampionCode(),
      db.select().from(badges),
      db
        .select({ status: matches.status, homeCode: matches.homeCode, awayCode: matches.awayCode })
        .from(matches)
        .where(ne(matches.status, "finished")),
    ]);

  const unfinishedWithTeams = allMatchStatuses.filter((m) => m.homeCode && m.awayCode).length;
  const championPending = !championCode;
  const teamByCode = new Map(allTeams.map((t) => [t.code, t]));
  const pickByParticipant = new Map(champPicks.map((c) => [c.participantId, c.teamCode]));

  const badgesByParticipant = new Map<number, Map<string, number>>();
  for (const b of allBadges) {
    if (!badgesByParticipant.has(b.participantId)) {
      badgesByParticipant.set(b.participantId, new Map());
    }
    const badgeMap = badgesByParticipant.get(b.participantId)!;
    badgeMap.set(b.badgeType, (badgeMap.get(b.badgeType) ?? 0) + 1);
  }

  const medal = (rank: number) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}º`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black">Classificação</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Desempate: placares exatos → resultados corretos → campeão.
            {championCode && (
              <>
                {" "}
                Campeão: {teamByCode.get(championCode)?.flag}{" "}
                <b>{teamByCode.get(championCode)?.name}</b>
              </>
            )}
          </p>
        </div>
        <RankingShare standings={standings} />
      </div>

      <div className="space-y-3 md:hidden">
        {standings.map((s, i) => {
          const pick = pickByParticipant.get(s.participantId);
          const pickTeam = pick ? teamByCode.get(pick) : null;
          const isMe = session?.id === s.participantId;
          const prev = standings[i - 1];
          const tieLabel = prev ? tiebreakLabel(s, prev) : null;
          const myBadges = badgesByParticipant.get(s.participantId);
          const additionalMax =
            unfinishedWithTeams * 3 + (championPending && !s.championHit ? 5 : 0);

          return (
            <div key={s.participantId} className="space-y-2">
              {tieLabel && (
                <div className="rounded-full bg-foreground/6 px-3 py-1 text-center text-[11px] italic text-foreground/45">
                  desempate por {tieLabel} ↑
                </div>
              )}
              <div
                className={`surface-card rounded-[1.5rem] p-4 ${
                  isMe ? "ring-2 ring-gold/45 bg-gold/10" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 text-center text-2xl font-black">{medal(s.rank)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black">
                        {s.avatar} {s.name}
                      </span>
                      {isMe && <span className="text-xs font-bold text-pitch">(você)</span>}
                    </div>
                    {myBadges && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {[...myBadges.entries()].map(([type, count]) => {
                          const meta = BADGE_META[type];
                          return (
                            <span key={type} className="rounded-full bg-foreground/6 px-2 py-1 text-xs">
                              {meta.icon} {count > 1 ? `×${count}` : meta.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl bg-white/72 px-2 py-3 ring-1 ring-black/5">
                        <div className="text-xl font-black text-pitch-dark">{s.points}</div>
                        <div className="text-[11px] text-foreground/45">pts</div>
                      </div>
                      <div className="rounded-2xl bg-white/72 px-2 py-3 ring-1 ring-black/5">
                        <div className="text-xl font-black">{s.exactCount}</div>
                        <div className="text-[11px] text-foreground/45">exatos</div>
                      </div>
                      <div className="rounded-2xl bg-white/72 px-2 py-3 ring-1 ring-black/5">
                        <div className="text-xl font-black">{s.resultCount}</div>
                        <div className="text-[11px] text-foreground/45">resultados</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="text-foreground/55">Extras: {s.extraPoints}</span>
                      {additionalMax > 0 && (
                        <span className="text-foreground/45">máx {s.points + additionalMax}</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-foreground/55">Campeão: </span>
                      {pickTeam ? (
                        <span className={s.championHit ? "font-bold text-pitch" : "font-medium"}>
                          {pickTeam.flag} {pickTeam.name}
                          {s.championHit && " +5"}
                        </span>
                      ) : (
                        <span className="text-foreground/35">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {standings.length === 0 && (
          <div className="surface-card rounded-[1.5rem] px-4 py-8 text-center text-sm text-foreground/50">
            Nenhum participante ainda.
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-[1.5rem] bg-white shadow md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="soft-divider border-b text-left text-xs uppercase tracking-wide text-foreground/50">
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
              const additionalMax =
                unfinishedWithTeams * 3 + (championPending && !s.championHit ? 5 : 0);

              return (
                <>
                  {tieLabel && (
                    <tr key={`tie-${s.participantId}`}>
                      <td
                        colSpan={7}
                        className="bg-foreground/5 px-4 py-1 text-center text-xs italic text-foreground/40"
                      >
                        desempate por {tieLabel} ↑
                      </td>
                    </tr>
                  )}
                  <tr
                    key={s.participantId}
                    className={`soft-divider border-b ${isMe ? "bg-gold/10" : ""}`}
                    style={isMe ? { boxShadow: "inset 3px 0 0 var(--pitch)" } : undefined}
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
                                  {count > 1 && <sup className="text-[10px] font-bold">{count}</sup>}
                                </span>
                              );
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-base font-black text-pitch-dark">{s.points}</div>
                      {additionalMax > 0 && (
                        <div className="mt-0.5 text-[10px] leading-none text-foreground/40">
                          máx {s.points + additionalMax}
                        </div>
                      )}
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
        <div className="flex flex-wrap gap-3 text-xs text-foreground/60">
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
