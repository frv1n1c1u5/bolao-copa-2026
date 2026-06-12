import { db } from "@/db";
import { badges, predictions, matches } from "@/db/schema";
import { eq, and, gte, lt, inArray } from "drizzle-orm";
import { scorePrediction, EXACT_POINTS } from "./scoring";

export const BADGE_META: Record<string, { icon: string; label: string; desc: string }> = {
  vidente:    { icon: "🔮", label: "Vidente",    desc: "Mais placares exatos na rodada" },
  pe_frio:    { icon: "🧊", label: "Pé Frio",    desc: "Menos pontos na rodada" },
  pe_quente:  { icon: "🔥", label: "Pé Quente",  desc: "Sequência acima da média" },
  zebra_certa:{ icon: "🦓", label: "Zebra Certa",desc: "Acertou o resultado da zebra" },
};

/** Calcula e persiste badges para um conjunto de jogos finalizados de uma rodada. */
export async function calculateBadges(gameWeek: number, matchNums: number[]) {
  if (matchNums.length === 0) return;

  const [preds, finishedMatches] = await Promise.all([
    db.select().from(predictions).where(inArray(predictions.matchNum, matchNums)),
    db.select().from(matches).where(inArray(matches.num, matchNums)),
  ]);

  const resultsMap = new Map(
    finishedMatches
      .filter((m) => m.homeScore != null && m.awayScore != null)
      .map((m) => [m.num, { home: m.homeScore!, away: m.awayScore! }])
  );

  // Pontos por participante nessa rodada
  const scoreByParticipant = new Map<number, number>();
  const exactsByParticipant = new Map<number, number>();

  for (const pred of preds) {
    const result = resultsMap.get(pred.matchNum);
    if (!result) continue;
    const pts = scorePrediction(
      { home: pred.homeScore, away: pred.awayScore },
      result
    );
    const prev = scoreByParticipant.get(pred.participantId) ?? 0;
    scoreByParticipant.set(pred.participantId, prev + pts);
    if (pts === EXACT_POINTS) {
      exactsByParticipant.set(pred.participantId, (exactsByParticipant.get(pred.participantId) ?? 0) + 1);
    }
  }

  if (scoreByParticipant.size === 0) return;

  const scores = [...scoreByParticipant.entries()];
  const maxExacts = Math.max(...[...exactsByParticipant.values()]);
  const minScore = Math.min(...scores.map(([, s]) => s));
  const avgScore = scores.reduce((a, [, s]) => a + s, 0) / scores.length;

  const toInsert: { participantId: number; badgeType: string; gameWeek: number }[] = [];

  for (const [pid, pts] of scores) {
    // Vidente: mais placares exatos
    const exacts = exactsByParticipant.get(pid) ?? 0;
    if (exacts > 0 && exacts === maxExacts) {
      toInsert.push({ participantId: pid, badgeType: "vidente", gameWeek });
    }
    // Pé Frio: menos pontos (só se pontuou menos que a média)
    if (pts === minScore && pts < avgScore) {
      toInsert.push({ participantId: pid, badgeType: "pe_frio", gameWeek });
    }
    // Pé Quente: acima da média
    if (pts > avgScore * 1.5) {
      toInsert.push({ participantId: pid, badgeType: "pe_quente", gameWeek });
    }
  }

  // Zebra Certa: acertou o resultado de um jogo onde < 33% dos palpiteiros acertaram.
  // Regra objetiva: se a maioria errou o outcome → jogo foi zebra.
  // Mínimo de 3 palpites para contar (evita falso positivo em jogos com poucos palpites).
  for (const m of finishedMatches) {
    const result = resultsMap.get(m.num);
    if (!result) continue;
    const matchPreds = preds.filter((p) => p.matchNum === m.num);
    if (matchPreds.length < 3) continue;

    const correctCount = matchPreds.filter(
      (p) => scorePrediction({ home: p.homeScore, away: p.awayScore }, result) > 0
    ).length;
    const hitRate = correctCount / matchPreds.length;

    // Zebra: menos de 33% acertou
    if (hitRate >= 1 / 3) continue;

    for (const pred of matchPreds) {
      const pts = scorePrediction({ home: pred.homeScore, away: pred.awayScore }, result);
      if (pts > 0) {
        toInsert.push({ participantId: pred.participantId, badgeType: "zebra_certa", gameWeek });
      }
    }
  }

  if (toInsert.length === 0) return;

  await db
    .insert(badges)
    .values(toInsert)
    .onConflictDoNothing();
}
