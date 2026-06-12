import { redirect } from "next/navigation";
import { db } from "@/db";
import { extraPicks, participants, predictions, teams } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getMatchesWithTeams, getSetting } from "@/lib/queries";
import { hasApiKey } from "@/lib/football-api";
import { AdminPanel } from "./AdminPanel";

export const dynamic = "force-dynamic";

function dayKeyInSaoPaulo(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/");

  const [allMatches, allPeople, allTeams, allExtras, allPredictions, championOpen, extrasOpen, championCode] =
    await Promise.all([
      getMatchesWithTeams(),
      db.select().from(participants).orderBy(asc(participants.name)),
      db.select().from(teams).orderBy(asc(teams.name)),
      db.select().from(extraPicks),
      db.select().from(predictions),
      getSetting("champion_picks_open"),
      getSetting("extra_picks_open"),
      getSetting("champion_code"),
    ]);

  const todayKey = dayKeyInSaoPaulo(new Date());
  const predictionSet = new Set(allPredictions.map((p) => `${p.matchNum}:${p.participantId}`));
  const matchCoverage = Object.fromEntries(
    allMatches.map((match) => {
      const missingPeople = allPeople
        .filter((person) => !predictionSet.has(`${match.num}:${person.id}`))
        .map((person) => `${person.avatar} ${person.name}`);

      return [
        match.num,
        {
          isToday: dayKeyInSaoPaulo(match.kickoff) === todayKey,
          missingCount: missingPeople.length,
          missingPeople,
        },
      ];
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">🛠️ Painel do admin</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Lance resultados (placar dos 90 minutos no mata-mata!), defina confrontos e
        gerencie participantes.
      </p>
      <AdminPanel
        matches={allMatches.map((m) => ({ ...m, kickoff: m.kickoff.toISOString() }))}
        people={allPeople.map((p) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          isAdmin: p.isAdmin,
        }))}
        teams={allTeams}
        extras={allExtras}
        championOpen={championOpen !== "false"}
        extrasOpen={extrasOpen !== "false"}
        championCode={championCode}
        matchCoverage={matchCoverage}
        syncAvailable={hasApiKey()}
      />
    </div>
  );
}
