import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { calculateBadges } from "@/lib/badges";

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { gameWeek, matchNums } = await req.json();
  if (typeof gameWeek !== "number" || !Array.isArray(matchNums)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await calculateBadges(gameWeek, matchNums);
  return NextResponse.json({ ok: true });
}
