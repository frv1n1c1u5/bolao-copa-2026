import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { duels } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faca login" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const duelId = Number(id);
  const [duel] = await db.select().from(duels).where(eq(duels.id, duelId)).limit(1);
  if (!duel) return NextResponse.json({ error: "Duelo nao encontrado" }, { status: 404 });
  if (duel.challengedId !== session.id) {
    return NextResponse.json({ error: "Apenas o desafiado pode recusar" }, { status: 403 });
  }
  if (duel.status !== "pending") {
    return NextResponse.json({ error: "Duelo nao esta pendente" }, { status: 400 });
  }

  await db
    .update(duels)
    .set({ status: "declined" })
    .where(and(eq(duels.id, duelId), eq(duels.status, "pending")));

  return NextResponse.json({ ok: true });
}
