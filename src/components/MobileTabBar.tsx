"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "./LogoutButton";

const PRIMARY = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/palpites", label: "Palpites", icon: "📋" },
  { href: "/classificacao", label: "Ranking", icon: "🏆" },
  { href: "/premiacao", label: "Prêmios", icon: "🎁" },
];

const MORE = [
  { href: "/meu-desempenho", label: "Meu Desempenho", icon: "📊", auth: true },
  { href: "/estatisticas", label: "Estatísticas", icon: "📈", auth: false },
  { href: "/extras", label: "Extras", icon: "⭐", auth: false },
  { href: "/regras", label: "Regras", icon: "📜", auth: false },
];

interface Props {
  userName: string | null;
  isAdmin: boolean;
}

export function MobileTabBar({ userName, isAdmin }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function active(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const moreIsActive = MORE.some((l) => active(l.href)) || (isAdmin && pathname.startsWith("/admin"));

  return (
    <>
      {/* Tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-pitch border-t border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch">
          {PRIMARY.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                active(tab.href) ? "text-gold" : "text-white/60 hover:text-white"
              }`}
            >
              <span className="text-[20px] leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          ))}

          {/* Mais */}
          <button
            onClick={() => setOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
              moreIsActive || open ? "text-gold" : "text-white/60 hover:text-white"
            }`}
          >
            <span className="text-[20px] leading-none">⋯</span>
            <span>Mais</span>
          </button>
        </div>
      </nav>

      {/* Sheet "Mais" */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 md:hidden bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Painel de baixo pra cima */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-pitch rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Alça */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/25" />
            </div>

            <nav className="flex flex-col gap-0.5 px-3 pb-2">
              {MORE.filter((l) => !l.auth || userName).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    active(link.href) ? "bg-white/15" : "hover:bg-white/10"
                  }`}
                >
                  <span className="text-xl w-7 text-center leading-none">{link.icon}</span>
                  <span className="text-white font-medium">{link.label}</span>
                  {active(link.href) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                  )}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition mt-1 ${
                    pathname.startsWith("/admin") ? "bg-white/15" : "hover:bg-white/10"
                  }`}
                >
                  <span className="text-xl w-7 text-center leading-none">⚙️</span>
                  <span className="text-gold font-bold">Admin</span>
                </Link>
              )}
            </nav>

            {/* Rodapé: usuário + logout */}
            <div className="px-4 pt-2 pb-4 border-t border-white/10">
              {userName ? (
                <div className="flex items-center justify-between">
                  <Link
                    href="/meu-desempenho"
                    onClick={() => setOpen(false)}
                    className="text-gold font-bold hover:underline"
                  >
                    {userName}
                  </Link>
                  <LogoutButton />
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block text-center px-4 py-2.5 rounded-xl bg-gold text-pitch-dark font-bold hover:brightness-110 transition"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
