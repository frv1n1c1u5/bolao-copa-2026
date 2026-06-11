// Popula o banco com as 48 seleções e os 104 jogos da Copa 2026.
// Idempotente: usa upsert, pode rodar de novo sem duplicar.
// Uso: npm run db:seed  (precisa de DATABASE_URL no .env.local)

import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { teams, matches, settings } from "../src/db/schema";
import data from "./seed-data.json";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada (.env.local)");
  const db = drizzle(neon(url));

  for (const t of data.teams) {
    await db
      .insert(teams)
      .values({ code: t.code, name: t.name, group: t.group, flag: t.flag })
      .onConflictDoUpdate({
        target: teams.code,
        set: { name: t.name, group: t.group, flag: t.flag },
      });
  }
  console.log(`✔ ${data.teams.length} seleções`);

  for (const m of data.matches) {
    const row = {
      num: m.num,
      stage: m.stage,
      group: ("group" in m ? m.group : null) as string | null,
      homeCode: ("home" in m ? m.home : null) as string | null,
      awayCode: ("away" in m ? m.away : null) as string | null,
      homePlaceholder: ("homePlaceholder" in m ? m.homePlaceholder : null) as string | null,
      awayPlaceholder: ("awayPlaceholder" in m ? m.awayPlaceholder : null) as string | null,
      kickoff: new Date(m.kickoff),
      venue: m.venue,
      homeScore: ("homeScore" in m ? m.homeScore : null) as number | null,
      awayScore: ("awayScore" in m ? m.awayScore : null) as number | null,
      status: ("status" in m ? m.status : "scheduled") as string,
    };
    await db
      .insert(matches)
      .values(row)
      .onConflictDoUpdate({
        target: matches.num,
        // Não sobrescreve placar/confrontos já administrados; só dados de tabela.
        set: { kickoff: row.kickoff, venue: row.venue, stage: row.stage, group: row.group },
      });
  }
  console.log(`✔ ${data.matches.length} jogos`);

  await db
    .insert(settings)
    .values({ key: "champion_picks_open", value: "true" })
    .onConflictDoNothing();

  const count = await db.execute(sql`select count(*) from matches`);
  console.log("Seed concluído.", count.rows[0]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
