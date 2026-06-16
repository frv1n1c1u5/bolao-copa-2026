import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { matches, teams } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { fetchEspnSummaryForMatch, playersFromEspnSummary } from "@/lib/espn";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faca login" }, { status: 401 });
  }

  const url = new URL(req.url);
  const matchNum = Number(url.searchParams.get("matchNum"));
  if (!Number.isInteger(matchNum)) {
    return NextResponse.json({ error: "Jogo invalido" }, { status: 400 });
  }

  const [match] = await db.select().from(matches).where(eq(matches.num, matchNum)).limit(1);
  if (!match?.homeCode || !match.awayCode) {
    return NextResponse.json({ error: "Jogo ainda sem selecoes definidas" }, { status: 400 });
  }

  const [home] = await db.select().from(teams).where(eq(teams.code, match.homeCode)).limit(1);
  const [away] = await db.select().from(teams).where(eq(teams.code, match.awayCode)).limit(1);
  if (!home || !away) {
    return NextResponse.json({ error: "Selecoes nao encontradas" }, { status: 404 });
  }

  try {
    const { summary } = await fetchEspnSummaryForMatch({
      kickoff: match.kickoff,
      home: { code: home.code, name: home.name },
      away: { code: away.code, name: away.name },
    });
    const players = playersFromEspnSummary(summary);
    if (players.length === 0) {
      return NextResponse.json({ error: "Escalacao ainda indisponivel na ESPN" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, players });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao buscar jogadores" },
      { status: 502 }
    );
  }
}
