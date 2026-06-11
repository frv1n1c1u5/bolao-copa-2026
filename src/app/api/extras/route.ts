import { NextResponse } from "next/server";
import { db } from "@/db";
import { championPicks, extraPicks, teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getSetting } from "@/lib/queries";

const EXTRA_CATEGORIES = ["artilheiro", "craque", "zebra"];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const body = await req.json();

  if (body.type === "champion") {
    const open = (await getSetting("champion_picks_open")) !== "false";
    if (!open) {
      return NextResponse.json(
        { error: "Palpite de campeão já está travado" },
        { status: 403 }
      );
    }
    const teamRows = await db.select().from(teams).where(eq(teams.code, body.teamCode));
    if (!teamRows[0]) {
      return NextResponse.json({ error: "Seleção inválida" }, { status: 400 });
    }
    await db
      .insert(championPicks)
      .values({ participantId: session.id, teamCode: body.teamCode, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: championPicks.participantId,
        set: { teamCode: body.teamCode, updatedAt: new Date() },
      });
    return NextResponse.json({ ok: true });
  }

  if (body.type === "extra") {
    const open = (await getSetting("extra_picks_open")) !== "false";
    if (!open) {
      return NextResponse.json({ error: "Palpites extras travados" }, { status: 403 });
    }
    const { category, value } = body;
    if (!EXTRA_CATEGORIES.includes(category) || typeof value !== "string" || !value.trim()) {
      return NextResponse.json({ error: "Palpite inválido" }, { status: 400 });
    }
    await db
      .insert(extraPicks)
      .values({
        participantId: session.id,
        category,
        value: value.trim().slice(0, 100),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [extraPicks.participantId, extraPicks.category],
        set: { value: value.trim().slice(0, 100), updatedAt: new Date() },
      });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
}
