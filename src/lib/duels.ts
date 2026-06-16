export const DUEL_MARKETS = [
  {
    key: "possession",
    label: "Mais posse de bola",
    description: "Quem termina com mais controle da bola.",
    mandatory: true,
  },
  {
    key: "total_shots",
    label: "Mais finalizacoes",
    description: "Quem chuta mais vezes no total.",
    mandatory: true,
  },
  {
    key: "shots_on_target",
    label: "Mais chutes no alvo",
    description: "Quem acerta mais o gol.",
    mandatory: false,
  },
  {
    key: "corners",
    label: "Mais escanteios",
    description: "Quem forca mais bolas paradas pelo fundo.",
    mandatory: false,
  },
  {
    key: "cards",
    label: "Mais cartoes",
    description: "Amarelos + vermelhos.",
    mandatory: false,
  },
  {
    key: "first_goal_team",
    label: "Primeiro time a marcar",
    description: "Inclui opcao sem gol.",
    mandatory: false,
  },
  {
    key: "first_half_goal",
    label: "Gol no 1o tempo",
    description: "Sim ou nao ate o intervalo.",
    mandatory: true,
  },
  {
    key: "goal_scorer",
    label: "Jogador marca gol",
    description: "Gol contra nao conta.",
    mandatory: false,
  },
] as const;

export type DuelMarketKey = (typeof DUEL_MARKETS)[number]["key"];
export type DuelSide = "home" | "away" | "draw" | "none" | "yes" | "no";
export type DuelPickValue = DuelSide | string;
export type DuelPicks = Partial<Record<DuelMarketKey, DuelPickValue>>;

export interface DuelPlayer {
  id: string;
  name: string;
  team: "home" | "away";
}

export interface DuelMatchStats {
  home: {
    possession: number | null;
    totalShots: number | null;
    shotsOnTarget: number | null;
    corners: number | null;
    cards: number | null;
  };
  away: {
    possession: number | null;
    totalShots: number | null;
    shotsOnTarget: number | null;
    corners: number | null;
    cards: number | null;
  };
  firstGoalTeam: "home" | "away" | "none" | null;
  firstHalfGoal: boolean | null;
  goalScorerIds: string[];
}

export interface DuelScoreResult {
  points: number;
  hits: DuelMarketKey[];
  misses: DuelMarketKey[];
  voided: DuelMarketKey[];
}

const MARKET_KEYS = new Set<string>(DUEL_MARKETS.map((m) => m.key));
const MANDATORY_MARKETS = DUEL_MARKETS.filter((m) => m.mandatory).map((m) => m.key);

export function parseMarkets(value: string): DuelMarketKey[] {
  try {
    const parsed = JSON.parse(value);
    return validateMarkets(parsed);
  } catch {
    return [...MANDATORY_MARKETS];
  }
}

export function parsePicks(value: string): DuelPicks {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function serializeJson(value: unknown): string {
  return JSON.stringify(value);
}

export function validateMarkets(markets: unknown): DuelMarketKey[] {
  if (!Array.isArray(markets)) {
    throw new Error("Mercados invalidos");
  }
  const unique = [...new Set(markets)];
  if (!unique.every((m) => typeof m === "string" && MARKET_KEYS.has(m))) {
    throw new Error("Mercado desconhecido");
  }
  for (const mandatory of MANDATORY_MARKETS) {
    if (!unique.includes(mandatory)) {
      throw new Error("Posse, finalizacoes e gol no 1o tempo sao obrigatorios");
    }
  }
  return unique as DuelMarketKey[];
}

export function validatePicks(
  markets: DuelMarketKey[],
  picks: unknown,
  players: DuelPlayer[] = []
): DuelPicks {
  if (typeof picks !== "object" || picks === null) {
    throw new Error("Palpites invalidos");
  }
  const raw = picks as Record<string, unknown>;
  const next: DuelPicks = {};
  const playerIds = new Set(players.map((p) => p.id));

  for (const market of markets) {
    const value = raw[market];
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error("Preencha todos os mercados do duelo");
    }
    if (
      ["possession", "total_shots", "shots_on_target", "corners", "cards"].includes(market) &&
      !["home", "away", "draw"].includes(value)
    ) {
      throw new Error("Palpite invalido");
    }
    if (market === "first_goal_team" && !["home", "away", "none"].includes(value)) {
      throw new Error("Palpite invalido");
    }
    if (market === "first_half_goal" && !["yes", "no"].includes(value)) {
      throw new Error("Palpite invalido");
    }
    if (market === "goal_scorer" && players.length > 0 && !playerIds.has(value)) {
      throw new Error("Jogador invalido");
    }
    next[market] = value;
  }

  return next;
}

function winner(home: number | null, away: number | null): "home" | "away" | "draw" | null {
  if (home === null || away === null) return null;
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

function marketResult(market: DuelMarketKey, stats: DuelMatchStats): DuelPickValue | null {
  switch (market) {
    case "possession":
      return winner(stats.home.possession, stats.away.possession);
    case "total_shots":
      return winner(stats.home.totalShots, stats.away.totalShots);
    case "shots_on_target":
      return winner(stats.home.shotsOnTarget, stats.away.shotsOnTarget);
    case "corners":
      return winner(stats.home.corners, stats.away.corners);
    case "cards":
      return winner(stats.home.cards, stats.away.cards);
    case "first_goal_team":
      return stats.firstGoalTeam;
    case "first_half_goal":
      return stats.firstHalfGoal === null ? null : stats.firstHalfGoal ? "yes" : "no";
    case "goal_scorer":
      return stats.goalScorerIds.length > 0 ? "__multi__" : "none";
  }
}

export function scoreDuelPicks(
  markets: DuelMarketKey[],
  picks: DuelPicks,
  stats: DuelMatchStats
): DuelScoreResult {
  const result: DuelScoreResult = { points: 0, hits: [], misses: [], voided: [] };

  for (const market of markets) {
    const pick = picks[market];
    const actual = marketResult(market, stats);
    if (!pick || actual === null) {
      result.voided.push(market);
      continue;
    }
    const hit =
      market === "goal_scorer"
        ? stats.goalScorerIds.includes(String(pick))
        : pick === actual;
    if (hit) {
      result.points += 1;
      result.hits.push(market);
    } else {
      result.misses.push(market);
    }
  }

  return result;
}
