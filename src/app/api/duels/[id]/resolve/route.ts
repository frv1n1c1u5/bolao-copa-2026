import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelPicks, duels, matches, teams } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { fetchEspnSummaryForMatch, statsFromEspnSummary } from "@/lib/espn";
import { parseMarkets, parsePicks, scoreDuelPicks, serializeJson } from "@/lib/duels";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faca login" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const duelId = Number(id);
  const [duel] = await db.select().from(duels).where(eq(duels.id, duelId)).limit(1);
  if (!duel) return NextResponse.json({ error: "Duelo nao encontrado" }, { status: 404 });
  if (duel.challengerId !== session.id && duel.challengedId !== session.id && !session.isAdmin) {
    return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
  }
  if (duel.status !== "accepted") {
    return NextResponse.json({ error: "Duelo ainda nao aceito" }, { status: 400 });
  }

  const [match] = await db.select().from(matches).where(eq(matches.num, duel.matchNum)).limit(1);
  if (!match?.homeCode || !match.awayCode || match.status !== "finished") {
    return NextResponse.json({ error: "Resultado do jogo ainda nao finalizado" }, { status: 400 });
  }
  const [home] = await db.select().from(teams).where(eq(teams.code, match.homeCode)).limit(1);
  const [away] = await db.select().from(teams).where(eq(teams.code, match.awayCode)).limit(1);
  if (!home || !away) {
    return NextResponse.json({ error: "Selecoes nao encontradas" }, { status: 404 });
  }

  const picks = await db
    .select()
    .from(duelPicks)
    .where(inArray(duelPicks.participantId, [duel.challengerId, duel.challengedId]));
  const duelPicksRows = picks.filter((p) => p.duelId === duelId);
  if (duelPicksRows.length < 2) {
    return NextResponse.json({ error: "Faltam palpites do duelo" }, { status: 400 });
  }

  try {
    const { summary } = await fetchEspnSummaryForMatch({
      kickoff: match.kickoff,
      home: { code: home.code, name: home.name },
      away: { code: away.code, name: away.name },
    });
    const stats = statsFromEspnSummary(summary);
    const markets = parseMarkets(duel.markets);
    const scored = duelPicksRows.map((row) => ({
      row,
      score: scoreDuelPicks(markets, parsePicks(row.picks), stats),
    }));
    for (const item of scored) {
      await db
        .update(duelPicks)
        .set({ points: item.score.points })
        .where(
          and(
            eq(duelPicks.duelId, duelId),
            eq(duelPicks.participantId, item.row.participantId)
          )
        );
    }

    const challenger = scored.find((s) => s.row.participantId === duel.challengerId)!;
    const challenged = scored.find((s) => s.row.participantId === duel.challengedId)!;
    const winnerParticipantId =
      challenger.score.points === challenged.score.points
        ? null
        : challenger.score.points > challenged.score.points
          ? duel.challengerId
          : duel.challengedId;

    await db
      .update(duels)
      .set({
        status: "resolved",
        winnerParticipantId,
        resolvedAt: new Date(),
        resultSummary: serializeJson({ stats, scores: scored.map((s) => s.score) }),
      })
      .where(eq(duels.id, duelId));

    return NextResponse.json({ ok: true, winnerParticipantId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao apurar duelo" },
      { status: 502 }
    );
  }
}
