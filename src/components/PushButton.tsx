"use client";

import { useEffect, useState } from "react";

type Status = "unsupported" | "denied" | "subscribed" | "unsubscribed" | "loading";


export function PushButton() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        setStatus(sub ? "subscribed" : "unsubscribed");
      })
    );
  }, []);

  async function toggle() {
    if (status === "subscribed") {
      await unsubscribe();
    } else {
      await subscribe();
    }
  }

  async function subscribe() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada");
        setStatus("unsubscribed");
        return;
      }
      // Browsers modernos aceitam a string base64url diretamente
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus("subscribed");
    } catch (e) {
      console.error("Erro ao ativar notificações:", e);
      setStatus("unsubscribed");
    }
  }

  async function unsubscribe() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (e) {
      console.error("Erro ao desativar notificações:", e);
      setStatus("subscribed");
    }
  }

  if (status === "unsupported" || status === "denied") return null;

  return (
    <button
      onClick={toggle}
      disabled={status === "loading"}
      title={status === "subscribed" ? "Desativar notificações" : "Ativar notificações de palpite"}
      aria-label={status === "subscribed" ? "Desativar notificações" : "Ativar notificações"}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 hover:bg-white/10"
    >
      <span className="text-base leading-none">
        {status === "loading" ? "⏳" : status === "subscribed" ? "🔔" : "🔕"}
      </span>
      <span className="hidden sm:inline">
        {status === "subscribed" ? "Notificações ativas" : "Ativar notificações"}
      </span>
    </button>
  );
}
