import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await req.json();
  const endpoint: string = sub.endpoint;
  const p256dh: string = sub.keys?.p256dh;
  const auth: string = sub.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Subscription inválida" }, { status: 400 });
  }

  await db
    .insert(pushSubscriptions)
    .values({ participantId: session.id, endpoint, p256dhKey: p256dh, authKey: auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { participantId: session.id, p256dhKey: p256dh, authKey: auth },
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "endpoint obrigatório" }, { status: 400 });

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.participantId, session.id),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );

  return NextResponse.json({ ok: true });
}
