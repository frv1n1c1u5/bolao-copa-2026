import { NextResponse } from "next/server";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { fetchWorldCupMatches, hasApiKey } from "@/lib/football-api";

// Sincroniza placares (e confrontos do mata-mata) com football-data.org.
// O lançamento manual continua valendo: o sync só preenche, nunca apaga.
export async function POST() {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Apenas admin" }, { status: 403 });
  }
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "FOOTBALL_DATA_API_KEY não configurada" },
      { status: 400 }
    );
  }

  let apiMatches;
  try {
    apiMatches = await fetchWorldCupMatches();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha na API" },
      { status: 502 }
    );
  }

  const ourMatches = await db.select().from(matches);
  let updatedScores = 0;
  let updatedMatchups = 0;

  for (const api of apiMatches) {
    const apiTime = new Date(api.utcDate).getTime();

    // 1) Mesmo confronto definido → atualiza placar de jogos encerrados.
    if (api.status === "FINISHED" && api.homeCode && api.awayCode) {
      const ours = ourMatches.find(
        (m) =>
          m.homeCode === api.homeCode &&
          m.awayCode === api.awayCode &&
          Math.abs(m.kickoff.getTime() - apiTime) < 36 * 3600 * 1000
      );
      if (
        ours &&
        api.homeScore !== null &&
        api.awayScore !== null &&
        (ours.status !== "finished" ||
          ours.homeScore !== api.homeScore ||
          ours.awayScore !== api.awayScore)
      ) {
        await db
          .update(matches)
          .set({
            homeScore: api.homeScore,
            awayScore: api.awayScore,
            status: "finished",
          })
          .where(eq(matches.num, ours.num));
        updatedScores++;
        continue;
      }
    }

    // 2) Mata-mata com placeholder → preenche o confronto quando definido.
    if (api.homeCode && api.awayCode) {
      const ours = ourMatches.find(
        (m) =>
          m.stage !== "group" &&
          (!m.homeCode || !m.awayCode) &&
          m.kickoff.getTime() === apiTime
      );
      if (ours) {
        await db
          .update(matches)
          .set({ homeCode: api.homeCode, awayCode: api.awayCode })
          .where(eq(matches.num, ours.num));
        updatedMatchups++;
      }
    }
  }

  return NextResponse.json({ ok: true, updatedScores, updatedMatchups });
}
