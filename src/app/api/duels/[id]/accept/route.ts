import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { duels, duelPicks, matches, teams } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { fetchEspnSummaryForMatch, playersFromEspnSummary } from "@/lib/espn";
import { parseMarkets, serializeJson, validatePicks, type DuelPlayer } from "@/lib/duels";

async function playersForDuel(match: typeof matches.$inferSelect, markets: string[]) {
  if (!markets.includes("goal_scorer") || !match.homeCode || !match.awayCode) return [];
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

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faca login" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const duelId = Number(id);
  const { picks } = await req.json().catch(() => ({}));

  const [duel] = await db.select().from(duels).where(eq(duels.id, duelId)).limit(1);
  if (!duel) return NextResponse.json({ error: "Duelo nao encontrado" }, { status: 404 });
  if (duel.challengedId !== session.id) {
    return NextResponse.json({ error: "Apenas o desafiado pode aceitar" }, { status: 403 });
  }
  if (duel.status !== "pending") {
    return NextResponse.json({ error: "Duelo nao esta pendente" }, { status: 400 });
  }

  const [match] = await db.select().from(matches).where(eq(matches.num, duel.matchNum)).limit(1);
  if (!match || Date.now() >= match.kickoff.getTime()) {
    return NextResponse.json({ error: "Jogo ja comecou" }, { status: 403 });
  }

  const markets = parseMarkets(duel.markets);
  let players: DuelPlayer[] = [];
  try {
    players = await playersForDuel(match, markets);
    if (markets.includes("goal_scorer") && players.length === 0) {
      return NextResponse.json(
        { error: "Escalacao indisponivel para mercado de jogador" },
        { status: 400 }
      );
    }
    const cleanPicks = validatePicks(markets, picks, players);
    await db
      .insert(duelPicks)
      .values({
        duelId,
        participantId: session.id,
        picks: serializeJson(cleanPicks),
      })
      .onConflictDoUpdate({
        target: [duelPicks.duelId, duelPicks.participantId],
        set: { picks: serializeJson(cleanPicks), submittedAt: new Date() },
      });
    await db
      .update(duels)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(and(eq(duels.id, duelId), eq(duels.status, "pending")));

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao aceitar duelo" },
      { status: 400 }
    );
  }
}
