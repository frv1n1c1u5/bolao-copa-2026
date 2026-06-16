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
  { href: "/duelos", label: "1v1", icon: "⚔️", auth: true },
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
      <nav
        className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-3 mb-3 rounded-[1.6rem] border border-white/12 bg-[color:var(--header-bg)]/94 px-2 py-2 shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="flex items-stretch">
            {PRIMARY.map((tab) => {
              const isActive = active(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex-1 rounded-2xl px-1 py-2 text-center transition ${
                    isActive ? "bg-white/12 text-gold" : "text-white/62"
                  }`}
                >
                  <span className="block text-[20px] leading-none">{tab.icon}</span>
                  <span className="mt-1 block text-[10px] font-semibold">{tab.label}</span>
                </Link>
              );
            })}

            <button
              onClick={() => setOpen(true)}
              className={`flex-1 rounded-2xl px-1 py-2 text-center transition ${
                moreIsActive || open ? "bg-white/12 text-gold" : "text-white/62"
              }`}
            >
              <span className="block text-[20px] leading-none">⋯</span>
              <span className="mt-1 block text-[10px] font-semibold">Mais</span>
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/55 md:hidden" onClick={() => setOpen(false)} />

          <div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-[1.75rem] bg-[color:var(--header-bg)] px-3 pt-3 shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex justify-center pb-3">
              <div className="h-1 w-10 rounded-full bg-white/28" />
            </div>

            <nav className="flex flex-col gap-1 pb-2">
              {MORE.filter((l) => !l.auth || userName).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    active(link.href) ? "bg-white/14" : "hover:bg-white/10"
                  }`}
                >
                  <span className="w-7 text-center text-xl leading-none">{link.icon}</span>
                  <span className="font-medium text-white">{link.label}</span>
                  {active(link.href) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className={`mt-1 flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    pathname.startsWith("/admin") ? "bg-white/14" : "hover:bg-white/10"
                  }`}
                >
                  <span className="w-7 text-center text-xl leading-none">⚙️</span>
                  <span className="font-bold text-gold">Admin</span>
                </Link>
              )}
            </nav>

            <div className="border-t border-white/10 px-1 pb-4 pt-3">
              {userName ? (
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href="/meu-desempenho"
                    onClick={() => setOpen(false)}
                    className="truncate font-bold text-gold hover:underline"
                  >
                    {userName}
                  </Link>
                  <LogoutButton />
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl bg-gold px-4 py-2.5 text-center font-bold text-pitch-dark transition hover:brightness-110"
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
