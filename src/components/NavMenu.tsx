"use client";

import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { PushButton } from "./PushButton";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/palpites", label: "Palpites" },
  { href: "/classificacao", label: "Classificacao" },
  { href: "/duelos", label: "1v1" },
  { href: "/estatisticas", label: "Estatisticas" },
  { href: "/extras", label: "Extras" },
  { href: "/premiacao", label: "Premiacao" },
  { href: "/regras", label: "Regras" },
];

interface NavMenuProps {
  userName: string | null;
  isAdmin: boolean;
  pendingDuelInvites?: number;
}

// Apenas desktop; mobile usa MobileTabBar.
export function NavMenu({ userName, isAdmin, pendingDuelInvites = 0 }: NavMenuProps) {
  return (
    <nav className="hidden md:flex flex-wrap gap-1 text-sm font-medium ml-auto items-center">
      {NAV.map((item) => {
        const showBadge = item.href === "/duelos" && pendingDuelInvites > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative px-3 py-1.5 rounded-full hover:bg-pitch-dark transition-colors"
          >
            {item.label}
            {showBadge && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-black text-pitch-dark shadow-sm">
                {pendingDuelInvites > 9 ? "9+" : pendingDuelInvites}
              </span>
            )}
          </Link>
        );
      })}
      {isAdmin && (
        <Link
          href="/admin"
          className="px-3 py-1.5 rounded-full bg-gold/20 hover:bg-gold/30 transition-colors"
        >
          Admin
        </Link>
      )}
      {userName ? (
        <span className="flex items-center gap-2 pl-2">
          <Link href="/meu-desempenho" className="text-gold font-bold hover:underline transition">
            {userName}
          </Link>
          <PushButton />
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
  );
}
