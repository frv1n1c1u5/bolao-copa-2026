import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { duels, duelPicks, matches, participants, teams } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { dayKey } from "@/lib/format";
import { fetchEspnSummaryForMatch, playersFromEspnSummary } from "@/lib/espn";
import {
  parseMarkets,
  serializeJson,
  validateMarkets,
  validatePicks,
  type DuelPlayer,
} from "@/lib/duels";

async function playersForGoalScorer(match: typeof matches.$inferSelect): Promise<DuelPlayer[]> {
  if (!match.homeCode || !match.awayCode) return [];
  const [home] = await db.select().from(teams).where(eq(teams.code, match.homeCode)).limit(1);
  const [away] = await db.select().from(teams).where(eq(teams.code, match.awayCode)).limit(1);
  if (!home || !away) return [];
  const { summary } = await fetchEspnSummaryForMatch({
    kickoff: match.kickoff,
    home: { code: home.code, name: home.name },
    away: { code: away.code, name: away.name },
  });
  return playersFromEspnSummary(summary);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faca login" }, { status: 401 });
  }

  const { matchNum, challengedId, markets, picks } = await req.json().catch(() => ({}));
  if (!Number.isInteger(matchNum) || !Number.isInteger(challengedId)) {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
  }
  if (challengedId === session.id) {
    return NextResponse.json({ error: "Escolha outro participante" }, { status: 400 });
  }

  const [match] = await db.select().from(matches).where(eq(matches.num, matchNum)).limit(1);
  if (!match?.homeCode || !match.awayCode) {
    return NextResponse.json({ error: "Jogo ainda sem selecoes definidas" }, { status: 400 });
  }
  if (Date.now() >= match.kickoff.getTime()) {
    return NextResponse.json({ error: "Jogo ja comecou" }, { status: 403 });
  }
  if (dayKey(match.kickoff) !== dayKey(new Date())) {
    return NextResponse.json({ error: "O 1v1 so vale para jogos de hoje" }, { status: 400 });
  }

  const [challenged] = await db
    .select()
    .from(participants)
    .where(eq(participants.id, challengedId))
    .limit(1);
  if (!challenged) {
    return NextResponse.json({ error: "Participante nao encontrado" }, { status: 404 });
  }

  let selectedMarkets;
  try {
    selectedMarkets = validateMarkets(markets);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Mercados invalidos" },
      { status: 400 }
    );
  }

  try {
    const players = selectedMarkets.includes("goal_scorer")
      ? await playersForGoalScorer(match)
      : [];
    if (selectedMarkets.includes("goal_scorer") && players.length === 0) {
      return NextResponse.json(
        { error: "Escalacao indisponivel para mercado de jogador" },
        { status: 400 }
      );
    }
    const cleanPicks = validatePicks(parseMarkets(serializeJson(selectedMarkets)), picks, players);
    const [duel] = await db
      .insert(duels)
      .values({
        matchNum,
        challengerId: session.id,
        challengedId,
        markets: serializeJson(selectedMarkets),
        status: "pending",
      })
      .returning({ id: duels.id });

    await db.insert(duelPicks).values({
      duelId: duel.id,
      participantId: session.id,
      picks: serializeJson(cleanPicks),
    });

    return NextResponse.json({ ok: true, id: duel.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao criar duelo" },
      { status: 400 }
    );
  }
}
