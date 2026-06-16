import type { DuelMatchStats, DuelPlayer } from "./duels";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

interface TeamInfo {
  code: string;
  name: string;
}

interface MatchInfo {
  kickoff: Date;
  home: TeamInfo;
  away: TeamInfo;
}

interface EspnCompetitor {
  homeAway: "home" | "away";
  team?: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
  };
  score?: string;
}

interface EspnEvent {
  id: string;
  date: string;
  name?: string;
  competitions?: Array<{
    id: string;
    competitors?: EspnCompetitor[];
  }>;
}

interface EspnSummary {
  boxscore?: {
    teams?: Array<{
      team?: { displayName?: string; id?: string };
      statistics?: Array<{ name?: string; displayName?: string; displayValue?: string }>;
    }>;
  };
  keyEvents?: Array<{
    type?: { type?: string; text?: string };
    text?: string;
    scoringPlay?: boolean;
    team?: string | { displayName?: string; id?: string };
    clock?: { value?: number; displayValue?: string };
    participants?: Array<{ athlete?: { id?: string; displayName?: string } }>;
  }>;
  rosters?: Array<{
    homeAway?: "home" | "away";
    team?: { displayName?: string; id?: string };
    roster?: Array<{
      active?: boolean;
      starter?: boolean;
      jersey?: string;
      athlete?: { id?: string; displayName?: string };
      position?: { abbreviation?: string };
    }>;
  }>;
}

const CODE_TO_ESPN_NAME: Record<string, string> = {
  CPV: "Cape Verde",
  KSA: "Saudi Arabia",
  IRN: "Iran",
  RSA: "South Africa",
  KOR: "South Korea",
  COD: "Congo DR",
  CZE: "Czechia",
  CUW: "Curacao",
  CIV: "Ivory Coast",
};

function espnName(team: TeamInfo) {
  return CODE_TO_ESPN_NAME[team.code] ?? team.name;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dateParam(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("-", "");
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0", accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ESPN respondeu ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function eventTeams(event: EspnEvent) {
  const competitors = event.competitions?.[0]?.competitors ?? [];
  return {
    home: competitors.find((c) => c.homeAway === "home")?.team?.displayName ?? "",
    away: competitors.find((c) => c.homeAway === "away")?.team?.displayName ?? "",
  };
}

export async function findEspnEvent(match: MatchInfo): Promise<EspnEvent | null> {
  const home = normalize(espnName(match.home));
  const away = normalize(espnName(match.away));
  const data = await fetchJson<{ events?: EspnEvent[] }>(
    `${ESPN_BASE}/scoreboard?dates=${dateParam(match.kickoff)}`
  );

  return (
    data.events?.find((event) => {
      const teams = eventTeams(event);
      return normalize(teams.home) === home && normalize(teams.away) === away;
    }) ?? null
  );
}

export async function fetchEspnSummary(eventId: string): Promise<EspnSummary> {
  return fetchJson<EspnSummary>(`${ESPN_BASE}/summary?event=${eventId}`);
}

export async function fetchEspnSummaryForMatch(match: MatchInfo) {
  const event = await findEspnEvent(match);
  if (!event) {
    throw new Error("Nao encontrei o jogo na ESPN");
  }
  return { event, summary: await fetchEspnSummary(event.id) };
}

function numberStat(
  summary: EspnSummary,
  side: "home" | "away",
  statName: string
): number | null {
  const team = summary.boxscore?.teams?.[side === "home" ? 0 : 1];
  const value = team?.statistics?.find((s) => s.name === statName)?.displayValue;
  if (value == null) return null;
  const parsed = Number(String(value).replace("%", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function cardCount(summary: EspnSummary, side: "home" | "away") {
  const yellow = numberStat(summary, side, "yellowCards");
  const red = numberStat(summary, side, "redCards");
  if (yellow === null || red === null) return null;
  return yellow + red;
}

function eventSide(
  event: NonNullable<EspnSummary["keyEvents"]>[number],
  summary: EspnSummary
): "home" | "away" | null {
  const teamName = typeof event.team === "string" ? event.team : event.team?.displayName;
  if (!teamName) return null;
  const rosters = summary.rosters ?? [];
  const home = rosters.find((r) => r.homeAway === "home")?.team?.displayName;
  const away = rosters.find((r) => r.homeAway === "away")?.team?.displayName;
  if (home && normalize(home) === normalize(teamName)) return "home";
  if (away && normalize(away) === normalize(teamName)) return "away";
  return null;
}

export function playersFromEspnSummary(summary: EspnSummary): DuelPlayer[] {
  return (summary.rosters ?? []).flatMap((roster) => {
    const side = roster.homeAway;
    if (side !== "home" && side !== "away") return [];
    return (roster.roster ?? [])
      .filter((player) => player.athlete?.id && player.athlete.displayName)
      .map((player) => ({
        id: player.athlete!.id!,
        name: player.athlete!.displayName!,
        team: side,
      }));
  });
}

export function statsFromEspnSummary(summary: EspnSummary): DuelMatchStats {
  const scoringEvents = (summary.keyEvents ?? []).filter((event) => event.scoringPlay);
  const normalGoals = scoringEvents.filter((event) =>
    String(event.type?.type ?? "").startsWith("goal")
  );
  const firstGoal = scoringEvents[0] ?? null;

  return {
    home: {
      possession: numberStat(summary, "home", "possessionPct"),
      totalShots: numberStat(summary, "home", "totalShots"),
      shotsOnTarget: numberStat(summary, "home", "shotsOnTarget"),
      corners: numberStat(summary, "home", "wonCorners"),
      cards: cardCount(summary, "home"),
    },
    away: {
      possession: numberStat(summary, "away", "possessionPct"),
      totalShots: numberStat(summary, "away", "totalShots"),
      shotsOnTarget: numberStat(summary, "away", "shotsOnTarget"),
      corners: numberStat(summary, "away", "wonCorners"),
      cards: cardCount(summary, "away"),
    },
    firstGoalTeam: firstGoal ? eventSide(firstGoal, summary) : "none",
    firstHalfGoal: scoringEvents.some((event) => (event.clock?.value ?? 999999) <= 2700),
    goalScorerIds: normalGoals
      .map((event) => event.participants?.[0]?.athlete?.id)
      .filter((id): id is string => Boolean(id)),
  };
}
