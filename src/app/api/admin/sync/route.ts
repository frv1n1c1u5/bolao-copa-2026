import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasApiKey } from "@/lib/football-api";
import { syncMatchResults } from "@/lib/sync-matches";

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

  try {
    const result = await syncMatchResults();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha na API" },
      { status: 502 }
    );
  }
}
