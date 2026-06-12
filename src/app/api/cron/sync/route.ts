import { type NextRequest, NextResponse } from "next/server";
import { hasApiKey } from "@/lib/football-api";
import { syncMatchResults } from "@/lib/sync-matches";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: sem secret configurado, permite
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasApiKey()) {
    return NextResponse.json({ ok: false, skipped: "no api key" });
  }

  try {
    const result = await syncMatchResults();
    console.log("[cron/sync]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/sync] erro:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "sync falhou" },
      { status: 502 }
    );
  }
}
