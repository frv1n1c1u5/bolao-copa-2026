import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { matches, settings } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { calculateBadges } from "@/lib/badges";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(settings).where(eq(settings.key, key));
  return rows[0]?.value ?? null;
}

async function upsertSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Descobre desde quando calcular (última execução)
  const lastCalcStr = await getSetting("last_badge_calc_at");
  const lastCalc = lastCalcStr ? new Date(lastCalcStr) : new Date(0);

  // Busca jogos finalizados desde a última execução
  const newlyFinished = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.status, "finished"),
        gt(matches.kickoff, lastCalc)
      )
    );

  if (newlyFinished.length === 0) {
    console.log("[cron/badges] sem jogos novos desde", lastCalc.toISOString());
    return NextResponse.json({ ok: true, skipped: "no new matches" });
  }

  // Número da rodada — incrementa a cada execução
  const weekStr = await getSetting("badge_game_week_counter");
  const gameWeek = weekStr ? parseInt(weekStr, 10) + 1 : 1;

  const matchNums = newlyFinished.map((m) => m.num);
  await calculateBadges(gameWeek, matchNums);

  // Salva estado
  await Promise.all([
    upsertSetting("last_badge_calc_at", new Date().toISOString()),
    upsertSetting("badge_game_week_counter", String(gameWeek)),
  ]);

  console.log(`[cron/badges] rodada ${gameWeek} — ${matchNums.length} jogos, badges calculados`);
  return NextResponse.json({ ok: true, gameWeek, matchCount: matchNums.length });
}
