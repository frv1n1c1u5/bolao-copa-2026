// Service Worker do Bolão Copa 2026
// Handles Web Push notifications

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Bolão Copa 2026", {
      body: data.body ?? "",
      icon: "/apple-icon.png",
      badge: "/apple-icon.png",
      tag: data.tag ?? "bolao",
      renotify: true,
      data: { url: data.url ?? "/palpites" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/palpites";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        clients.openWindow(url);
      }
    })
  );
});
