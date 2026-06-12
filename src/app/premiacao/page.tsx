import { db } from "@/db";
import { participants, settings } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { PremiacaoClient } from "./PremiacaoClient";

export const dynamic = "force-dynamic";

export default async function PremiacaoPage() {
  const session = await getSession();

  const [parts, settingRows] = await Promise.all([
    db.select({ id: participants.id }).from(participants),
    db.select().from(settings),
  ]);

  const settingsMap = new Map(settingRows.map((s) => [s.key, s.value]));
  const savedEntrada = parseFloat(settingsMap.get("valor_entrada") ?? "50");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">🏅 Premiação</h1>
        <p className="text-sm text-foreground/60">
          Distribuição do pote entre os campeões do bolão.
        </p>
      </div>
      <PremiacaoClient
        numParticipants={parts.length}
        isAdmin={session?.isAdmin ?? false}
        savedEntrada={savedEntrada}
      />
    </div>
  );
}
