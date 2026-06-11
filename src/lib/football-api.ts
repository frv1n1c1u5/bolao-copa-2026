// Cliente do football-data.org (free tier) usado pelo botão "Sincronizar" do admin.
// Sem FOOTBALL_DATA_API_KEY o sync fica indisponível e tudo funciona manualmente.

const API_BASE = "https://api.football-data.org/v4";

// Nomes em inglês da API → nossos códigos FIFA
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
  Türkiye: "TUR",
  Germany: "GER",
  Curaçao: "CUW",
  Curacao: "CUW",
  "Ivory Coast": "CIV",
  "Côte d'Ivoire": "CIV",
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
  utcDate: string;
  status: string; // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED ...
  homeCode: string | null;
  awayCode: string | null;
  /** Placar dos 90 minutos (fullTime exclui prorrogação só quando a API separa; usamos regularTime quando existir) */
  homeScore: number | null;
  awayScore: number | null;
}

function teamCode(team: { name?: string; shortName?: string } | null): string | null {
  if (!team) return null;
  return NAME_TO_CODE[team.name ?? ""] ?? NAME_TO_CODE[team.shortName ?? ""] ?? null;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.FOOTBALL_DATA_API_KEY);
}

export async function fetchWorldCupMatches(): Promise<ApiMatch[]> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY não configurada");

  const res = await fetch(`${API_BASE}/competitions/WC/matches`, {
    headers: { "X-Auth-Token": key },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`football-data.org respondeu ${res.status}`);
  }
  const data = await res.json();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data.matches ?? []).map((m: any): ApiMatch => {
    // Para jogos com prorrogação a API traz score.regularTime (90 min);
    // fullTime inclui prorrogação. O bolão pontua pelos 90 minutos.
    const regular = m.score?.regularTime;
    const full = m.score?.fullTime;
    const score = regular?.home != null ? regular : full;
    return {
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
