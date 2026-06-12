import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchWorldCupMatches } from "./football-api";

export async function syncMatchResults(): Promise<{ updatedScores: number; updatedMatchups: number }> {
  const apiMatches = await fetchWorldCupMatches();
  const ourMatches = await db.select().from(matches);
  let updatedScores = 0;
  let updatedMatchups = 0;

  for (const api of apiMatches) {
    const apiTime = new Date(api.utcDate).getTime();

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
          .set({ homeScore: api.homeScore, awayScore: api.awayScore, status: "finished" })
          .where(eq(matches.num, ours.num));
        updatedScores++;
        continue;
      }
    }

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

  return { updatedScores, updatedMatchups };
}
