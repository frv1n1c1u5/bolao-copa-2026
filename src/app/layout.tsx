import type { Metadata } from "next";
import { Geist } from "next/font/google";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased theme-${phase}`}>
      <head>
        <meta name="theme-color" content={PHASE_COLORS[phase]} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <header className="bg-pitch text-white shadow-md">
          <div className="mx-auto w-full max-w-5xl px-4 py-3 flex items-center gap-3">
            <Link href="/" className="text-xl font-black tracking-tight shrink-0">
              ⚽ Bolão da Copa <span className="text-gold">2026</span>
            </Link>
            <NavMenu userName={session?.name ?? null} isAdmin={session?.isAdmin ?? false} />
          </div>
        </header>
        {/* pb-20 reserva espaço para o tab bar no mobile */}
        <main className="mx-auto w-full max-w-5xl px-4 py-6 flex-1 pb-20 md:pb-6">{children}</main>
        <Toaster />
        <footer className="hidden md:block mx-auto w-full max-w-5xl px-4 py-8 text-center text-xs text-foreground/50">
          Bolão da família — Copa do Mundo 2026 🏆 Que os palpites estejam inspirados!
        </footer>
        <MobileTabBar userName={session?.name ?? null} isAdmin={session?.isAdmin ?? false} />
      </body>
    </html>
  );
}
