import { NextResponse } from "next/server";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// Define os confrontos do mata-mata conforme a Copa avança.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Apenas admin" }, { status: 403 });
  }

  const { matchNum, homeCode, awayCode } = await req.json();
  if (!Number.isInteger(matchNum)) {
    return NextResponse.json({ error: "Jogo inválido" }, { status: 400 });
  }

  await db
    .update(matches)
    .set({
      homeCode: homeCode || null,
      awayCode: awayCode || null,
    })
    .where(eq(matches.num, matchNum));
  return NextResponse.json({ ok: true });
}
