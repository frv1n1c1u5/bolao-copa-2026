import { asc, desc, inArray, or, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { duelPicks, duels, participants } from "@/db/schema";
import { dayKey } from "@/lib/format";
import { getSession } from "@/lib/auth";
import { getMatchesWithTeams } from "@/lib/queries";
import { parseMarkets, parsePicks } from "@/lib/duels";
import { DuelosClient, type DuelView } from "./DuelosClient";

export const dynamic = "force-dynamic";

export default async function DuelosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [allMatches, people, myDuels] = await Promise.all([
    getMatchesWithTeams(),
    db.select().from(participants).orderBy(asc(participants.name)),
    db
      .select()
      .from(duels)
      .where(or(eq(duels.challengerId, session.id), eq(duels.challengedId, session.id)))
      .orderBy(desc(duels.createdAt)),
  ]);

  const duelIds = myDuels.map((d) => d.id);
  const picks = duelIds.length
    ? await db.select().from(duelPicks).where(inArray(duelPicks.duelId, duelIds))
    : [];

  const peopleById = new Map(people.map((p) => [p.id, p]));
  const matchesByNum = new Map(allMatches.map((m) => [m.num, m]));
  const todayKey = dayKey(new Date());
  const now = new Date();
  const todayMatches = allMatches
    .filter((m) => m.home && m.away && dayKey(m.kickoff) === todayKey && m.kickoff > now)
    .map((m) => ({ ...m, kickoff: m.kickoff.toISOString() }));

  const duelViews: DuelView[] = myDuels.map((duel) => {
    const match = matchesByNum.get(duel.matchNum);
    const challenger = peopleById.get(duel.challengerId);
    const challenged = peopleById.get(duel.challengedId);
    return {
      id: duel.id,
      status: duel.status,
      markets: parseMarkets(duel.markets),
      winnerParticipantId: duel.winnerParticipantId,
      resultSummary: duel.resultSummary,
      createdAt: duel.createdAt.toISOString(),
      acceptedAt: duel.acceptedAt?.toISOString() ?? null,
      resolvedAt: duel.resolvedAt?.toISOString() ?? null,
      challenger: {
        id: duel.challengerId,
        name: challenger?.name ?? "Participante",
        avatar: challenger?.avatar ?? "⚽",
      },
      challenged: {
        id: duel.challengedId,
        name: challenged?.name ?? "Participante",
        avatar: challenged?.avatar ?? "⚽",
      },
      match: match
        ? { ...match, kickoff: match.kickoff.toISOString() }
        : null,
      picks: Object.fromEntries(
        picks
          .filter((p) => p.duelId === duel.id)
          .map((p) => [
            p.participantId,
            {
              picks: parsePicks(p.picks),
              points: p.points,
              submittedAt: p.submittedAt.toISOString(),
            },
          ])
      ),
    };
  });

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-pitch/70">Duelo simbolico</p>
        <h1 className="mt-1 text-3xl font-black text-pitch-dark">1v1</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/60">
          Chame alguem da familia para um duelo de estatisticas. Nao vale premio, so
          provocacao saudavel depois do apito final.
        </p>
      </div>
      <DuelosClient
        currentParticipantId={session.id}
        people={people
          .filter((p) => p.id !== session.id)
          .map((p) => ({ id: p.id, name: p.name, avatar: p.avatar }))}
        matches={todayMatches}
        duels={duelViews}
      />
    </div>
  );
}
