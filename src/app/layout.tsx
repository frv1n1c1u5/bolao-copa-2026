import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getCurrentPhase } from "@/lib/format";
import { db } from "@/db";
import { duels } from "@/db/schema";
import { and, eq } from "drizzle-orm";

import { Toaster } from "@/components/Toaster";
import { NavMenu } from "@/components/NavMenu";
import { MobileTabBar } from "@/components/MobileTabBar";
import "./globals.css";

const PHASE_COLORS = {
  grupos: "#0a7e3d",
  matamata: "#1a3a5c",
  final: "#a07000",
};

export const metadata: Metadata = {
  title: "Bolão Copa 2026",
  description: "Bolão da família — Copa do Mundo 2026",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Bolão 2026",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const pendingDuelInvites = session
    ? (
        await db
          .select()
          .from(duels)
          .where(and(eq(duels.challengedId, session.id), eq(duels.status, "pending")))
      ).length
    : 0;
  const phase = getCurrentPhase();
  const mobileInitial = session?.name?.trim().charAt(0).toUpperCase();

  return (
    <html lang="pt-BR" className={`h-full antialiased theme-${phase}`}>
      <head>
        <meta name="theme-color" content={PHASE_COLORS[phase]} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <div className="app-shell min-h-full flex flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[color:var(--header-bg)]/92 text-white shadow-md backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
              <Link href="/" className="shrink-0 text-lg font-black tracking-tight sm:text-xl">
                ⚽ Bolão da Copa <span className="text-gold">2026</span>
              </Link>
              <div className="ml-auto md:hidden">
                {session ? (
                  <Link
                    href="/meu-desempenho"
                    aria-label="Abrir meu desempenho"
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/16 bg-white/10 text-sm font-black text-white shadow-sm transition hover:bg-white/18"
                    title={session.name}
                  >
                    {mobileInitial}
                    {pendingDuelInvites > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-black text-pitch-dark shadow-sm">
                        {pendingDuelInvites > 9 ? "9+" : pendingDuelInvites}
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full bg-gold px-4 py-2 text-sm font-black text-pitch-dark transition hover:brightness-110"
                  >
                    Entrar
                  </Link>
                )}
              </div>
              <NavMenu
                userName={session?.name ?? null}
                isAdmin={session?.isAdmin ?? false}
                pendingDuelInvites={pendingDuelInvites}
              />
            </div>
          </header>
          <main className="mx-auto flex-1 w-full max-w-5xl px-4 py-5 pb-24 md:py-6 md:pb-6">
            {children}
          </main>
          <Toaster />
          <footer className="hidden md:block mx-auto w-full max-w-5xl px-4 py-8 text-center text-xs text-foreground/50">
            Bolão da família — Copa do Mundo 2026 🏆 Que os palpites estejam inspirados!
          </footer>
          <MobileTabBar
            userName={session?.name ?? null}
            isAdmin={session?.isAdmin ?? false}
            pendingDuelInvites={pendingDuelInvites}
          />
        </div>
      </body>
    </html>
  );
}
