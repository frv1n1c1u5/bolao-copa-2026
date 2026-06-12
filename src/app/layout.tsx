import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getCurrentPhase } from "@/lib/format";

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
  const phase = getCurrentPhase();

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
              <NavMenu userName={session?.name ?? null} isAdmin={session?.isAdmin ?? false} />
            </div>
          </header>
          <main className="mx-auto flex-1 w-full max-w-5xl px-4 py-5 pb-24 md:py-6 md:pb-6">
            {children}
          </main>
          <Toaster />
          <footer className="hidden md:block mx-auto w-full max-w-5xl px-4 py-8 text-center text-xs text-foreground/50">
            Bolão da família — Copa do Mundo 2026 🏆 Que os palpites estejam inspirados!
          </footer>
          <MobileTabBar userName={session?.name ?? null} isAdmin={session?.isAdmin ?? false} />
        </div>
      </body>
    </html>
  );
}
