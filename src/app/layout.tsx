import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentPhase } from "@/lib/format";
import { Toaster } from "@/components/Toaster";
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

const NAV = [
  { href: "/", label: "Início" },
  { href: "/palpites", label: "Palpites" },
  { href: "/classificacao", label: "Classificação" },
  { href: "/estatisticas", label: "Estatísticas" },
  { href: "/extras", label: "Extras" },
  { href: "/premiacao", label: "Premiação" },
  { href: "/regras", label: "Regras" },
];

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
          <div className="mx-auto w-full max-w-5xl px-4 py-3 flex flex-wrap items-center gap-3">
            <Link href="/" className="text-xl font-black tracking-tight">
              ⚽ Bolão da Copa <span className="text-gold">2026</span>
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm font-medium ml-auto items-center">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-full hover:bg-pitch-dark transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              {session?.isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-full bg-gold/20 hover:bg-gold/30 transition-colors"
                >
                  Admin
                </Link>
              )}
              {session ? (
                <span className="flex items-center gap-2 pl-2">
                  <span className="text-gold font-bold">{session.name}</span>
                  <LogoutButton />
                </span>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-full bg-gold text-pitch-dark font-bold hover:brightness-110 transition"
                >
                  Entrar
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-6 flex-1">{children}</main>
        <Toaster />
        <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-center text-xs text-foreground/50">
          Bolão da família — Copa do Mundo 2026 🏆 Que os palpites estejam inspirados!
        </footer>
      </body>
    </html>
  );
}
