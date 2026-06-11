import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { participants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { participantId, pin } = await req.json();
  if (typeof participantId !== "number" || typeof pin !== "string") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(participants)
    .where(eq(participants.id, participantId));
  const person = rows[0];
  if (!person || !(await bcrypt.compare(pin, person.pinHash))) {
    return NextResponse.json({ error: "PIN incorreto" }, { status: 401 });
  }

  await createSession({ id: person.id, name: person.name, isAdmin: person.isAdmin });
  return NextResponse.json({ ok: true });
}
