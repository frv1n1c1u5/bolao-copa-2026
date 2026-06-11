import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { matches, participants, predictions, teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { formatKickoff, STAGE_LABELS } from "@/lib/format";
import { scorePrediction } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function JogoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const num = parseInt(id, 10);
  if (!Number.isInteger(num)) notFound();

  const [matchRows, allTeams, allPeople, preds, session] = await Promise.all([
    db.select().from(matches).where(eq(matches.num, num)),
    db.select().from(teams),
    db.select().from(participants),
    db.select().from(predictions).where(eq(predictions.matchNum, num)),
    getSession(),
  ]);
  const match = matchRows[0];
  if (!match) notFound();

  const teamByCode = new Map(allTeams.map((t) => [t.code, t]));
  const personById = new Map(allPeople.map((p) => [p.id, p]));
  const home = match.homeCode ? teamByCode.get(match.homeCode) : null;
  const away = match.awayCode ? teamByCode.get(match.awayCode) : null;
  const started = Date.now() >= match.kickoff.getTime();
  const finished =
    match.status === "finished" && match.homeScore !== null && match.awayScore !== null;

  // Anti-cola: palpites dos outros só aparecem depois do apito inicial.
  const visiblePreds = started
    ? preds
    : preds.filter((p) => p.participantId === session?.id);

  const rows = visiblePreds
    .map((p) => {
      const person = personById.get(p.participantId);
      const pts = finished
        ? scorePrediction(
            { home: p.homeScore, away: p.awayScore },
            { home: match.homeScore!, away: match.awayScore! }
          )
        : null;
      return { person, pred: p, pts };
    })
    .sort((a, b) => (b.pts ?? -1) - (a.pts ?? -1));

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/palpites" className="text-sm text-pitch underline">
        ← voltar aos palpites
      </Link>

      <div className="mt-4 rounded-2xl bg-white p-6 shadow text-center">
        <p className="text-xs text-foreground/50 mb-3">
          {STAGE_LABELS[match.stage]}
          {match.group ? ` · Grupo ${match.group}` : ""} · Jogo {match.num} ·{" "}
          {formatKickoff(match.kickoff)}
        </p>
        <div className="flex items-center justify-center gap-4">
          <span className="flex-1 text-right">
            <span className="text-3xl">{home?.flag}</span>
            <div className="font-black">{home?.name ?? match.homePlaceholder}</div>
          </span>
          <span className="text-3xl font-black tabular-nums">
            {finished ? `${match.homeScore} × ${match.awayScore}` : "×"}
          </span>
          <span className="flex-1 text-left">
            <span className="text-3xl">{away?.flag}</span>
            <div className="font-black">{away?.name ?? match.awayPlaceholder}</div>
          </span>
        </div>
        <p className="mt-3 text-xs text-foreground/40">{match.venue}</p>
        {finished && match.stage !== "group" && (
          <p className="mt-1 text-xs text-foreground/40">
            placar dos 90 minutos (vale para o bolão)
          </p>
        )}
      </div>

      <h2 className="mt-6 mb-2 text-lg font-black">
        Palpites {started ? "" : "(os dos outros aparecem após o início 🤫)"}
      </h2>
      <div className="rounded-xl bg-white shadow divide-y divide-foreground/5">
        {rows.map(({ person, pred, pts }) => (
          <div key={pred.participantId} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="flex-1 font-bold">
              {person?.avatar} {person?.name}
            </span>
            <span className="font-black tabular-nums">
              {pred.homeScore} × {pred.awayScore}
            </span>
            {pts !== null && (
              <span
                className={`w-16 text-right font-bold ${
                  pts === 3 ? "text-gold" : pts === 1 ? "text-pitch" : "text-foreground/30"
                }`}
              >
                {pts === 3 ? "🎯 +3" : pts === 1 ? "✓ +1" : "0"}
              </span>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-foreground/50">
            Nenhum palpite {started ? "foi registrado para este jogo." : "seu ainda."}
          </p>
        )}
      </div>
    </div>
  );
}
