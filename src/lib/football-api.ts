// Cliente do football-data.org usado pelo botao "Sincronizar" do admin.
// Sem FOOTBALL_DATA_API_KEY o sync fica indisponivel e tudo funciona manualmente.

const API_BASE = "https://api.football-data.org/v4";

// Nomes em ingles da API -> nossos codigos FIFA
const NAME_TO_CODE: Record<string, string> = {
  Mexico: "MEX",
  "South Korea": "KOR",
  "Korea Republic": "KOR",
  Czechia: "CZE",
  "Czech Republic": "CZE",
  "South Africa": "RSA",
  Canada: "CAN",
  "Bosnia and Herzegovina": "BIH",
  "Bosnia-Herzegovina": "BIH",
  Qatar: "QAT",
  Switzerland: "SUI",
  Brazil: "BRA",
  Morocco: "MAR",
  Haiti: "HAI",
  Scotland: "SCO",
  "United States": "USA",
  USA: "USA",
  Paraguay: "PAR",
  Australia: "AUS",
  Turkey: "TUR",
  "Turkiye": "TUR",
  Germany: "GER",
  "Curacao": "CUW",
  "Ivory Coast": "CIV",
  "Cote d'Ivoire": "CIV",
  Ecuador: "ECU",
  Netherlands: "NED",
  Japan: "JPN",
  Sweden: "SWE",
  Tunisia: "TUN",
  Belgium: "BEL",
  Egypt: "EGY",
  Iran: "IRN",
  "IR Iran": "IRN",
  "New Zealand": "NZL",
  Spain: "ESP",
  "Cape Verde": "CPV",
  "Cape Verde Islands": "CPV",
  "Saudi Arabia": "KSA",
  Uruguay: "URU",
  France: "FRA",
  Senegal: "SEN",
  Iraq: "IRQ",
  Norway: "NOR",
  Argentina: "ARG",
  Algeria: "ALG",
  Austria: "AUT",
  Jordan: "JOR",
  Portugal: "POR",
  "DR Congo": "COD",
  "Congo DR": "COD",
  Uzbekistan: "UZB",
  Colombia: "COL",
  England: "ENG",
  Croatia: "CRO",
  Ghana: "GHA",
  Panama: "PAN",
};

export interface ApiMatch {
  apiId?: number;
  utcDate: string;
  status: string; // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED ...
  homeCode: string | null;
  awayCode: string | null;
  /** Placar dos 90 minutos: usamos regularTime quando existir, senao fullTime. */
  homeScore: number | null;
  awayScore: number | null;
}

export interface AdvancedMarketProbe {
  key: string;
  label: string;
  available: boolean;
  detail: string;
}

export interface MatchAdvancedProbe {
  apiMatchId: number;
  status: string;
  matchedBy: string;
  homeName: string | null;
  awayName: string | null;
  availableMarkets: number;
  viable: boolean;
  markets: AdvancedMarketProbe[];
}

function teamCode(team: { name?: string; shortName?: string } | null): string | null {
  if (!team) return null;
  return NAME_TO_CODE[team.name ?? ""] ?? NAME_TO_CODE[team.shortName ?? ""] ?? null;
}

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function countFilledStats(stats: Record<string, unknown> | undefined) {
  if (!stats) return 0;
  return Object.values(stats).filter(hasNumber).length;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.FOOTBALL_DATA_API_KEY);
}

async function fetchWorldCupMatchesRaw() {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY nao configurada");

  const res = await fetch(`${API_BASE}/competitions/WC/matches`, {
    headers: { "X-Auth-Token": key },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`football-data.org respondeu ${res.status}`);
  }
  return res.json();
}

async function fetchMatchRaw(apiMatchId: number) {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY nao configurada");

  const res = await fetch(`${API_BASE}/matches/${apiMatchId}`, {
    headers: {
      "X-Auth-Token": key,
      "X-Unfold-Goals": "true",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`football-data.org respondeu ${res.status}`);
  }
  return res.json();
}

export async function fetchWorldCupMatches(): Promise<ApiMatch[]> {
  const data = await fetchWorldCupMatchesRaw();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data.matches ?? []).map((m: any): ApiMatch => {
    const regular = m.score?.regularTime;
    const full = m.score?.fullTime;
    const score = regular?.home != null ? regular : full;
    return {
      apiId: m.id,
      utcDate: m.utcDate,
      status: m.status,
      homeCode: teamCode(m.homeTeam),
      awayCode: teamCode(m.awayTeam),
      homeScore: score?.home ?? null,
      awayScore: score?.away ?? null,
    };
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function analyzeAdvancedMatchData(match: any): MatchAdvancedProbe {
  const homeStats = match.homeTeam?.statistics as Record<string, unknown> | undefined;
  const awayStats = match.awayTeam?.statistics as Record<string, unknown> | undefined;
  const homeLineup = Array.isArray(match.homeTeam?.lineup) ? match.homeTeam.lineup.length : 0;
  const awayLineup = Array.isArray(match.awayTeam?.lineup) ? match.awayTeam.lineup.length : 0;
  const goals = Array.isArray(match.goals) ? match.goals : [];
  const bookings = Array.isArray(match.bookings) ? match.bookings : [];
  const halfTime = match.score?.halfTime;

  const markets: AdvancedMarketProbe[] = [
    {
      key: "goal_scorers",
      label: "Autores de gol",
      available: goals.some((g: any) => Boolean(g?.scorer?.name)),
      detail: `${goals.filter((g: any) => Boolean(g?.scorer?.name)).length} gols com autor`,
    },
    {
      key: "half_time_score",
      label: "Placar do 1o tempo",
      available: hasNumber(halfTime?.home) && hasNumber(halfTime?.away),
      detail:
        hasNumber(halfTime?.home) && hasNumber(halfTime?.away)
          ? `${halfTime.home} x ${halfTime.away}`
          : "nao informado",
    },
    {
      key: "possession",
      label: "Posse de bola",
      available: hasNumber(homeStats?.ball_possession) && hasNumber(awayStats?.ball_possession),
      detail:
        hasNumber(homeStats?.ball_possession) && hasNumber(awayStats?.ball_possession)
          ? `${homeStats.ball_possession}% x ${awayStats.ball_possession}%`
          : "nao informada",
    },
    {
      key: "cards",
      label: "Cartoes",
      available: bookings.some((b: any) => Boolean(b?.player?.name || b?.team?.name || b?.card)),
      detail: `${bookings.length} registros`,
    },
    {
      key: "corners",
      label: "Escanteios",
      available: hasNumber(homeStats?.corner_kicks) && hasNumber(awayStats?.corner_kicks),
      detail:
        hasNumber(homeStats?.corner_kicks) && hasNumber(awayStats?.corner_kicks)
          ? `${homeStats.corner_kicks} x ${awayStats.corner_kicks}`
          : "nao informado",
    },
    {
      key: "shots",
      label: "Finalizacoes",
      available: hasNumber(homeStats?.shots) && hasNumber(awayStats?.shots),
      detail:
        hasNumber(homeStats?.shots) && hasNumber(awayStats?.shots)
          ? `${homeStats.shots} x ${awayStats.shots}`
          : "nao informadas",
    },
    {
      key: "lineups",
      label: "Escalacoes",
      available: homeLineup >= 11 && awayLineup >= 11,
      detail: `${homeLineup} x ${awayLineup} jogadores`,
    },
    {
      key: "team_stats",
      label: "Pacote de estatisticas",
      available: countFilledStats(homeStats) >= 4 && countFilledStats(awayStats) >= 4,
      detail: `${countFilledStats(homeStats)} x ${countFilledStats(awayStats)} campos preenchidos`,
    },
  ];
  const availableMarkets = markets.filter((m) => m.available).length;

  return {
    apiMatchId: match.id,
    status: match.status,
    matchedBy: "football-data.org /v4/matches/{id}",
    homeName: match.homeTeam?.name ?? null,
    awayName: match.awayTeam?.name ?? null,
    availableMarkets,
    viable: availableMarkets >= 4,
    markets,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function probeWorldCupMatchAdvancedData(match: {
  kickoff: Date;
  homeCode: string | null;
  awayCode: string | null;
}): Promise<MatchAdvancedProbe> {
  if (!match.homeCode || !match.awayCode) {
    throw new Error("Jogo ainda sem selecoes definidas");
  }

  const data = await fetchWorldCupMatchesRaw();
  const kickoffIso = match.kickoff.toISOString();
  const apiMatch = (data.matches ?? []).find((m: unknown) => {
    const candidate = m as {
      id?: number;
      utcDate?: string;
      homeTeam?: { name?: string; shortName?: string };
      awayTeam?: { name?: string; shortName?: string };
    };
    return (
      candidate.utcDate === kickoffIso &&
      teamCode(candidate.homeTeam ?? null) === match.homeCode &&
      teamCode(candidate.awayTeam ?? null) === match.awayCode
    );
  });

  if (!apiMatch?.id) {
    throw new Error("Nao encontrei esse jogo na API pelo horario e selecoes");
  }

  const detailedMatch = await fetchMatchRaw(apiMatch.id);
  return analyzeAdvancedMatchData(detailedMatch);
}
