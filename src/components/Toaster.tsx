"use client";

import { useEffect, useState } from "react";
import type { ToastType } from "@/lib/toast";

interface ToastItem {
  id: number;
  msg: string;
  type: ToastType;
}

let _id = 0;

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handler(e: Event) {
      const { msg, type } = (e as CustomEvent<{ msg: string; type: ToastType }>).detail;
      const id = ++_id;
      setItems((prev) => [...prev, { id, msg, type }]);
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3000);
    }
    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl px-5 py-3 text-sm font-bold shadow-lg text-white animate-fade-in ${
            t.type === "success"
              ? "bg-pitch"
              : t.type === "error"
                ? "bg-red-600"
                : "bg-foreground/80"
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
