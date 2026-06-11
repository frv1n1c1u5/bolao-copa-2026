import { NextResponse } from "next/server";
import { db } from "@/db";
import { extraPicks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// Admin marca quantos pontos cada palpite extra rendeu (ao fim da Copa).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Apenas admin" }, { status: 403 });
  }

  const { participantId, category, points } = await req.json();
  if (
    !Number.isInteger(participantId) ||
    typeof category !== "string" ||
    !Number.isInteger(points) ||
    points < 0
  ) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await db
    .update(extraPicks)
    .set({ pointsAwarded: points })
    .where(
      and(
        eq(extraPicks.participantId, participantId),
        eq(extraPicks.category, category)
      )
    );
  return NextResponse.json({ ok: true });
}
