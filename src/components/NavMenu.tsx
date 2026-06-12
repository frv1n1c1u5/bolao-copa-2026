"use client";

import { useState } from "react";
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

export function NavMenu({ userName, isAdmin }: NavMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav — visível em md+ */}
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
            <Link
              href="/meu-desempenho"
              className="text-gold font-bold hover:underline transition"
            >
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

      {/* Mobile: botão hambúrguer */}
      <button
        className="md:hidden ml-auto p-2 rounded-lg hover:bg-pitch-dark transition"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <rect x="2" y="4" width="18" height="2.5" rx="1.25" fill="white" />
          <rect x="2" y="10" width="18" height="2.5" rx="1.25" fill="white" />
          <rect x="2" y="16" width="18" height="2.5" rx="1.25" fill="white" />
        </svg>
      </button>

      {/* Drawer overlay */}
      {open && (
        <>
          {/* Fundo escuro — clica pra fechar */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Painel lateral */}
          <div className="fixed inset-y-0 right-0 w-72 bg-pitch z-50 flex flex-col shadow-2xl md:hidden">
            {/* Header do drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <span className="text-white font-black">⚽ Bolão 2026</span>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white p-1 rounded transition"
                aria-label="Fechar menu"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-white font-medium hover:bg-white/10 active:bg-white/20 transition"
                >
                  {item.label}
                </Link>
              ))}
              {userName && (
                <Link
                  href="/meu-desempenho"
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-white font-medium hover:bg-white/10 active:bg-white/20 transition"
                >
                  📊 Meu Desempenho
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-gold font-bold hover:bg-white/10 transition mt-1"
                >
                  ★ Admin
                </Link>
              )}
            </nav>

            {/* Rodapé: usuário + logout */}
            <div className="px-4 pb-6 pt-3 border-t border-white/10 space-y-3">
              <PushButton />
              {userName ? (
                <div className="flex items-center justify-between">
                  <span className="text-gold font-bold">{userName}</span>
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
