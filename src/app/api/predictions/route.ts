import { NextResponse } from "next/server";
import { db } from "@/db";
import { matches, predictions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { matchNum, homeScore, awayScore } = await req.json();
  if (
    !Number.isInteger(matchNum) ||
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0 ||
    homeScore > 99 ||
    awayScore > 99
  ) {
    return NextResponse.json({ error: "Palpite inválido" }, { status: 400 });
  }

  const rows = await db.select().from(matches).where(eq(matches.num, matchNum));
  const match = rows[0];
  if (!match) {
    return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
  }

  // Regra 1: palpites só antes do apito inicial.
  if (Date.now() >= match.kickoff.getTime()) {
    return NextResponse.json(
      { error: "Este jogo já começou — palpites encerrados" },
      { status: 403 }
    );
  }

  await db
    .insert(predictions)
    .values({
      participantId: session.id,
      matchNum,
      homeScore,
      awayScore,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [predictions.participantId, predictions.matchNum],
      set: { homeScore, awayScore, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const { matchNum } = await req.json();
  const rows = await db.select().from(matches).where(eq(matches.num, matchNum));
  const match = rows[0];
  if (!match || Date.now() >= match.kickoff.getTime()) {
    return NextResponse.json({ error: "Não permitido" }, { status: 403 });
  }
  await db
    .delete(predictions)
    .where(
      and(
        eq(predictions.participantId, session.id),
        eq(predictions.matchNum, matchNum)
      )
    );
  return NextResponse.json({ ok: true });
}
