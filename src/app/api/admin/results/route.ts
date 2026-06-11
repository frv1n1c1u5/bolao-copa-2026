import { NextResponse } from "next/server";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Apenas admin" }, { status: 403 });
  }

  const { matchNum, homeScore, awayScore, clear } = await req.json();
  if (!Number.isInteger(matchNum)) {
    return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
  }

  if (clear) {
    await db
      .update(matches)
      .set({ homeScore: null, awayScore: null, status: "scheduled" })
      .where(eq(matches.num, matchNum));
    return NextResponse.json({ ok: true });
  }

  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return NextResponse.json({ error: "Placar inválido" }, { status: 400 });
  }

  await db
    .update(matches)
    .set({ homeScore, awayScore, status: "finished" })
    .where(eq(matches.num, matchNum));
  return NextResponse.json({ ok: true });
}
