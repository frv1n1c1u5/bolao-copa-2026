import { redirect } from "next/navigation";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getMatchesWithTeams } from "@/lib/queries";
import { PredictionBoard } from "./PredictionBoard";

export const dynamic = "force-dynamic";

export default async function PalpitesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [allMatches, myPredictions] = await Promise.all([
    getMatchesWithTeams(),
    db.select().from(predictions).where(eq(predictions.participantId, session.id)),
  ]);

  const predByMatch = Object.fromEntries(
    myPredictions.map((p) => [p.matchNum, { home: p.homeScore, away: p.awayScore }])
  );

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">Seus palpites</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Palpite no placar dos 90 minutos. Depois do apito inicial, o jogo trava. 🔒
      </p>
      <PredictionBoard
        matches={allMatches.map((m) => ({
          ...m,
          kickoff: m.kickoff.toISOString(),
        }))}
        initialPredictions={predByMatch}
      />
    </div>
  );
}
