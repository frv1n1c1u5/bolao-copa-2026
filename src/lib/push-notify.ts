import webpush from "web-push";
import { db } from "@/db";
import { matches, predictions, pushSubscriptions } from "@/db/schema";
import { and, eq, gt, inArray, lt } from "drizzle-orm";

function setupVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushNotification(
  endpoint: string,
  p256dhKey: string,
  authKey: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  if (!setupVapid()) return;
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh: p256dhKey, auth: authKey } },
      JSON.stringify(payload)
    );
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    if (e.statusCode === 410 || e.statusCode === 404) {
      // Subscription expirada — remover automaticamente
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    }
    console.error("[push] falha:", e.statusCode, endpoint.slice(-30));
  }
}

/**
 * Envia lembretes para participantes que têm jogos sem palpite começando
 * nas próximas 2 horas (janela do cron de sync). Retorna quantas notificações enviou.
 */
export async function sendMatchReminders(): Promise<number> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return 0;

  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const upcoming = await db
    .select({ num: matches.num })
    .from(matches)
    .where(and(eq(matches.status, "scheduled"), gt(matches.kickoff, now), lt(matches.kickoff, inTwoHours)));

  if (upcoming.length === 0) return 0;

  const matchNums = upcoming.map((m) => m.num);

  const preds = await db
    .select({ participantId: predictions.participantId, matchNum: predictions.matchNum })
    .from(predictions)
    .where(inArray(predictions.matchNum, matchNums));

  const predSet = new Set(preds.map((p) => `${p.participantId}:${p.matchNum}`));
  const allSubs = await db.select().from(pushSubscriptions);
  if (allSubs.length === 0) return 0;

  let sent = 0;
  const notified = new Set<number>();

  for (const sub of allSubs) {
    if (notified.has(sub.participantId)) continue;
    const pending = matchNums.filter((n) => !predSet.has(`${sub.participantId}:${n}`));
    if (pending.length === 0) continue;

    notified.add(sub.participantId);
    await sendPushNotification(sub.endpoint, sub.p256dhKey, sub.authKey, {
      title: "⚽ Bolão Copa 2026",
      body:
        pending.length === 1
          ? "Tem um jogo começando em breve! Não esqueça do seu palpite."
          : `Tem ${pending.length} jogos chegando! Faça seus palpites antes do apito.`,
      url: "/palpites",
      tag: "match-reminder",
    });
    sent++;
  }

  return sent;
}
