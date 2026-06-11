import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSession } from "@/lib/auth";

const ALLOWED_KEYS = [
  "champion_picks_open",
  "extra_picks_open",
  "champion_code",
];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Apenas admin" }, { status: 403 });
  }

  const { key, value } = await req.json();
  if (!ALLOWED_KEYS.includes(key) || typeof value !== "string") {
    return NextResponse.json({ error: "Configuração inválida" }, { status: 400 });
  }

  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
  return NextResponse.json({ ok: true });
}
