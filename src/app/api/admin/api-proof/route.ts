import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasApiKey, probeWorldCupMatchAdvancedData } from "@/lib/football-api";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Apenas admin" }, { status: 403 });
  }
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "FOOTBALL_DATA_API_KEY nao configurada" },
      { status: 400 }
    );
  }

  const { matchNum } = await req.json().catch(() => ({}));
  const num = Number(matchNum);
  if (!Number.isInteger(num)) {
    return NextResponse.json({ error: "Jogo invalido" }, { status: 400 });
  }

  const [{ db }, { matches }] = await Promise.all([import("@/db"), import("@/db/schema")]);
  const [match] = await db.select().from(matches).where(eq(matches.num, num)).limit(1);
  if (!match) {
    return NextResponse.json({ error: "Jogo nao encontrado" }, { status: 404 });
  }

  try {
    const probe = await probeWorldCupMatchAdvancedData(match);
    return NextResponse.json({ ok: true, ...probe });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha na prova da API" },
      { status: 502 }
    );
  }
}
