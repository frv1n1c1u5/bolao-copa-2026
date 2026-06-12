"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Person {
  id: number;
  name: string;
  avatar: string;
}

export function LoginForm({ people }: { people: Person[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Person | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: selected.id, pin, rememberMe }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/palpites");
      router.refresh();
    } else {
      setError("PIN incorreto. Tente de novo.");
      setPin("");
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {people.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelected(p);
              setError("");
            }}
            className={`rounded-xl p-4 text-center shadow transition border-2 ${
              selected?.id === p.id
                ? "border-pitch bg-pitch/10"
                : "border-transparent bg-white hover:border-pitch/40"
            }`}
          >
            <div className="text-3xl mb-1">{p.avatar}</div>
            <div className="font-bold text-sm">{p.name}</div>
          </button>
        ))}
      </div>

      {selected && (
        <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow space-y-4">
          <label className="block text-sm font-bold">
            PIN de {selected.name}
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              autoFocus
              className="mt-2 w-full rounded-lg border border-foreground/20 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-pitch focus:outline-none"
              placeholder="••••"
            />
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded accent-pitch w-4 h-4"
            />
            Lembrar de mim por 90 dias
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pin.length !== 4 || loading}
            className="w-full rounded-lg bg-pitch py-3 font-bold text-white disabled:opacity-40 hover:bg-pitch-dark transition"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      )}
    </div>
  );
}
