import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { participants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

function validPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Apenas admin" }, { status: 403 });
  }

  const { name, pin, avatar, isAdmin } = await req.json();
  if (typeof name !== "string" || !name.trim() || !validPin(pin)) {
    return NextResponse.json(
      { error: "Nome e PIN de 4 dígitos são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    await db.insert(participants).values({
      name: name.trim(),
      pinHash: await bcrypt.hash(pin, 10),
      avatar: typeof avatar === "string" && avatar.trim() ? avatar.trim() : "⚽",
      isAdmin: Boolean(isAdmin),
    });
  } catch {
    return NextResponse.json({ error: "Nome já existe" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

// Resetar PIN
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Apenas admin" }, { status: 403 });
  }

  const { participantId, pin } = await req.json();
  if (!Number.isInteger(participantId) || !validPin(pin)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await db
    .update(participants)
    .set({ pinHash: await bcrypt.hash(pin, 10) })
    .where(eq(participants.id, participantId));
  return NextResponse.json({ ok: true });
}
