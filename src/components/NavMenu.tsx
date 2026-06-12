"use client";

import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { PushButton } from "./PushButton";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/palpites", label: "Palpites" },
  { href: "/classificacao", label: "Classificação" },
  { href: "/estatisticas", label: "Estatísticas" },
  { href: "/extras", label: "Extras" },
  { href: "/premiacao", label: "Premiação" },
  { href: "/regras", label: "Regras" },
];

interface NavMenuProps {
  userName: string | null;
  isAdmin: boolean;
}

// Apenas desktop — mobile usa MobileTabBar
export function NavMenu({ userName, isAdmin }: NavMenuProps) {
  return (
    <nav className="hidden md:flex flex-wrap gap-1 text-sm font-medium ml-auto items-center">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="px-3 py-1.5 rounded-full hover:bg-pitch-dark transition-colors"
        >
          {item.label}
        </Link>
      ))}
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
