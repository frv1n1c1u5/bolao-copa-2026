// Motor de pontuação do bolão — funções puras, sem dependência de banco.
//
// Regras:
// - 3 pontos: placar exato
// - 1 ponto: acertou o vencedor ou o empate
// - Mata-mata: vale o placar dos 90 minutos + acréscimos (o admin lança esse placar)
// - Campeão correto: +5 pontos
// - Desempate: (1) pontos, (2) placares exatos, (3) resultados corretos, (4) acertou o campeão

export const EXACT_POINTS = 3;
export const RESULT_POINTS = 1;
export const CHAMPION_POINTS = 5;

export interface Score {
  home: number;
  away: number;
}

export type Outcome = "home" | "away" | "draw";

export function outcome(s: Score): Outcome {
  if (s.home > s.away) return "home";
  if (s.home < s.away) return "away";
  return "draw";
}

/** Pontos de um palpite contra um resultado (placar dos 90 min). */
export function scorePrediction(prediction: Score, result: Score): number {
  if (prediction.home === result.home && prediction.away === result.away) {
    return EXACT_POINTS;
  }
  if (outcome(prediction) === outcome(result)) {
    return RESULT_POINTS;
  }
  return 0;
}

export interface ParticipantTally {
  participantId: number;
  name: string;
  avatar: string;
  points: number;
  exactCount: number;
  resultCount: number; // acertos de resultado SEM placar exato
  championHit: boolean;
  extraPoints: number;
  rank: number;
}

export interface PredictionRow {
  participantId: number;
  matchNum: number;
  homeScore: number;
  awayScore: number;
}

export interface FinishedMatch {
  num: number;
  homeScore: number;
  awayScore: number;
}

export interface ParticipantInfo {
  id: number;
  name: string;
  avatar: string;
  championTeamCode: string | null;
  extraPoints: number;
}

/**
 * Calcula a classificação completa. `championCode` é o campeão real
 * (null enquanto a Copa não acabou). Ordena pelos critérios de desempate
 * do regulamento; empate persistente compartilha a posição.
 */
export function computeStandings(
  participantsInfo: ParticipantInfo[],
  predictionRows: PredictionRow[],
  finishedMatches: FinishedMatch[],
  championCode: string | null
): ParticipantTally[] {
  const results = new Map(finishedMatches.map((m) => [m.num, m]));

  const tallies = participantsInfo.map((p) => {
    let points = 0;
    let exactCount = 0;
    let resultCount = 0;

    for (const pred of predictionRows) {
      if (pred.participantId !== p.id) continue;
      const result = results.get(pred.matchNum);
      if (!result) continue;
      const pts = scorePrediction(
        { home: pred.homeScore, away: pred.awayScore },
        { home: result.homeScore, away: result.awayScore }
      );
      points += pts;
      if (pts === EXACT_POINTS) exactCount++;
      else if (pts === RESULT_POINTS) resultCount++;
    }

    const championHit =
      championCode !== null && p.championTeamCode === championCode;
    if (championHit) points += CHAMPION_POINTS;
    points += p.extraPoints;

    return {
      participantId: p.id,
      name: p.name,
      avatar: p.avatar,
      points,
      exactCount,
      resultCount,
      championHit,
      extraPoints: p.extraPoints,
      rank: 0,
    };
  });

  tallies.sort(
    (a, b) =>
      b.points - a.points ||
      b.exactCount - a.exactCount ||
      b.resultCount - a.resultCount ||
      Number(b.championHit) - Number(a.championHit) ||
      a.name.localeCompare(b.name)
  );

  const tied = (a: ParticipantTally, b: ParticipantTally) =>
    a.points === b.points &&
    a.exactCount === b.exactCount &&
    a.resultCount === b.resultCount &&
    a.championHit === b.championHit;

  tallies.forEach((t, i) => {
    t.rank = i > 0 && tied(t, tallies[i - 1]) ? tallies[i - 1].rank : i + 1;
  });

  return tallies;
}
