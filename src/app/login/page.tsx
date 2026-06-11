import { db } from "@/db";
import { participants } from "@/db/schema";
import { asc } from "drizzle-orm";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const people = await db
    .select({
      id: participants.id,
      name: participants.name,
      avatar: participants.avatar,
    })
    .from(participants)
    .orderBy(asc(participants.name));

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-black mb-1">Quem é você?</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Escolha seu nome e digite seu PIN de 4 dígitos.
      </p>
      {people.length === 0 ? (
        <p className="rounded-xl bg-white p-6 shadow text-sm">
          Nenhum participante cadastrado ainda. Peça para o administrador criar
          os participantes no painel.
        </p>
      ) : (
        <LoginForm people={people} />
      )}
    </div>
  );
}
