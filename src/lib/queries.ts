import { db } from "@/db";
import {
  participants,
  matches,
  predictions,
  championPicks,
  extraPicks,
  settings,
  teams,
} from "@/db/schema";
import { eq, sum } from "drizzle-orm";
import { computeStandings, type ParticipantTally } from "@/lib/scoring";

export async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(settings).where(eq(settings.key, key));
  return rows[0]?.value ?? null;
}

/** Código do campeão real, definido pelo admin ao fim da Copa (settings.champion_code). */
export async function getChampionCode(): Promise<string | null> {
  return getSetting("champion_code");
}

export async function getStandings(): Promise<ParticipantTally[]> {
  const [people, preds, finished, champs, extras, championCode] = await Promise.all([
    db.select().from(participants),
    db.select().from(predictions),
    db.select().from(matches).where(eq(matches.status, "finished")),
    db.select().from(championPicks),
    db
      .select({
        participantId: extraPicks.participantId,
        points: sum(extraPicks.pointsAwarded),
      })
      .from(extraPicks)
      .groupBy(extraPicks.participantId),
    getChampionCode(),
  ]);

  const champByParticipant = new Map(champs.map((c) => [c.participantId, c.teamCode]));
  const extraByParticipant = new Map(
    extras.map((e) => [e.participantId, Number(e.points ?? 0)])
  );

  return computeStandings(
    people.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      championTeamCode: champByParticipant.get(p.id) ?? null,
      extraPoints: extraByParticipant.get(p.id) ?? 0,
    })),
    preds.map((p) => ({
      participantId: p.participantId,
      matchNum: p.matchNum,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
    })),
    finished
      .filter((m) => m.homeScore !== null && m.awayScore !== null)
      .map((m) => ({
        num: m.num,
        homeScore: m.homeScore!,
        awayScore: m.awayScore!,
      })),
    championCode
  );
}

export interface MatchWithTeams {
  num: number;
  stage: string;
  group: string | null;
  kickoff: Date;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  home: { code: string; name: string; flag: string } | null;
  away: { code: string; name: string; flag: string } | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
}

export async function getMatchesWithTeams(): Promise<MatchWithTeams[]> {
  const [allMatches, allTeams] = await Promise.all([
    db.select().from(matches),
    db.select().from(teams),
  ]);
  const byCode = new Map(allTeams.map((t) => [t.code, t]));
  return allMatches
    .map((m) => ({
      num: m.num,
      stage: m.stage,
      group: m.group,
      kickoff: m.kickoff,
      venue: m.venue,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: m.status,
      home: m.homeCode ? (byCode.get(m.homeCode) ?? null) : null,
      away: m.awayCode ? (byCode.get(m.awayCode) ?? null) : null,
      homePlaceholder: m.homePlaceholder,
      awayPlaceholder: m.awayPlaceholder,
    }))
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime() || a.num - b.num);
}
