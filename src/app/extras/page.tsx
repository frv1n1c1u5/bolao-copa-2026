import { redirect } from "next/navigation";
import { db } from "@/db";
import { championPicks, extraPicks, matches, participants, teams } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getSetting } from "@/lib/queries";
import { ZEBRA_CODES, getTeamStageIndex } from "@/lib/zebra";
import { ExtrasForm } from "./ExtrasForm";
import { ZebraLeaderboard } from "./ZebraLeaderboard";

export const dynamic = "force-dynamic";

export default async function ExtrasPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [allTeams, myChampion, myExtras, championOpen, extrasOpen, allChampions, allPeople, zebraPicks, finishedMatches] =
    await Promise.all([
      db.select().from(teams).orderBy(asc(teams.name)),
      db.select().from(championPicks).where(eq(championPicks.participantId, session.id)),
      db.select().from(extraPicks).where(eq(extraPicks.participantId, session.id)),
      getSetting("champion_picks_open"),
      getSetting("extra_picks_open"),
      db.select().from(championPicks),
      db.select().from(participants),
      db.select().from(extraPicks).where(eq(extraPicks.category, "zebra")),
      db.select({
        homeCode: matches.homeCode,
        awayCode: matches.awayCode,
        stage: matches.stage,
      }).from(matches).where(eq(matches.status, "finished")),
    ]);

  const championLocked = championOpen === "false";
  const extrasLocked = extrasOpen === "false";

  const personById = new Map(allPeople.map((p) => [p.id, p]));
  const teamByCode = new Map(allTeams.map((t) => [t.code, t]));

  const revealed = championLocked
    ? allChampions.map((c) => ({
        name: personById.get(c.participantId)?.name ?? "?",
        avatar: personById.get(c.participantId)?.avatar ?? "",
        team: teamByCode.get(c.teamCode),
      }))
    : [];

  // Leaderboard da zebra — visível para todos (não é spoiler de palpite, é bolão separado)
  const zebraEntries = zebraPicks
    .filter((z) => ZEBRA_CODES.has(z.value))
    .map((z) => {
      const person = personById.get(z.participantId);
      const team = teamByCode.get(z.value);
      return {
        name: person?.name ?? "?",
        avatar: person?.avatar ?? "",
        teamCode: z.value,
        teamFlag: team?.flag ?? "",
        teamName: team?.name ?? z.value,
        stageIndex: getTeamStageIndex(z.value, finishedMatches as { homeCode: string | null; awayCode: string | null; stage: string }[]),
        isMe: z.participantId === session.id,
      };
    });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black mb-1">⭐ Palpites extras</h1>
      <p className="text-sm text-foreground/60 mb-6">
        O campeão vale <b>+5 pontos</b> e trava antes das oitavas. Os demais valem pontos
        bônus definidos pelo grupo.
      </p>

      <ExtrasForm
        teams={allTeams}
        championPick={myChampion[0]?.teamCode ?? null}
        championLocked={championLocked}
        extras={Object.fromEntries(myExtras.map((e) => [e.category, e.value]))}
        extrasLocked={extrasLocked}
      />

      {revealed.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-black mb-2">🏆 Quem apostou em quem (campeão)</h2>
          <div className="rounded-xl bg-white shadow divide-y divide-foreground/5">
            {revealed.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="flex-1 font-bold">
                  {r.avatar} {r.name}
                </span>
                <span>
                  {r.team?.flag} {r.team?.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {zebraEntries.length > 0 && (
        <ZebraLeaderboard entries={zebraEntries} />
      )}
    </div>
  );
}
