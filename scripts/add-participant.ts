// Cria um participante direto no banco (útil para o primeiro admin).
// Uso: npm run add-participant -- "Nome" 1234 [--admin] [--avatar 🦁]

import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import { participants } from "../src/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada (.env.local)");

  const args = process.argv.slice(2);
  const name = args[0];
  const pin = args[1];
  const isAdmin = args.includes("--admin");
  const avatarIdx = args.indexOf("--avatar");
  const avatar = avatarIdx >= 0 ? args[avatarIdx + 1] : "⚽";

  if (!name || !/^\d{4}$/.test(pin ?? "")) {
    console.error('Uso: npm run add-participant -- "Nome" 1234 [--admin] [--avatar 🦁]');
    process.exit(1);
  }

  const db = drizzle(neon(url));
  await db.insert(participants).values({
    name,
    pinHash: await bcrypt.hash(pin, 10),
    isAdmin,
    avatar,
  });
  console.log(`✔ ${name} criado${isAdmin ? " (admin)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
