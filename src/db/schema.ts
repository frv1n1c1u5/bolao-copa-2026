import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  avatar: text("avatar").notNull().default("⚽"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teams = pgTable("teams", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  group: text("group").notNull(),
  flag: text("flag").notNull(),
});

// stage: group | r32 | r16 | qf | sf | third | final
// status: scheduled | finished
export const matches = pgTable("matches", {
  num: integer("num").primaryKey(),
  stage: text("stage").notNull(),
  group: text("group"),
  homeCode: text("home_code").references(() => teams.code),
  awayCode: text("away_code").references(() => teams.code),
  homePlaceholder: text("home_placeholder"),
  awayPlaceholder: text("away_placeholder"),
  kickoff: timestamp("kickoff", { withTimezone: true }).notNull(),
  venue: text("venue").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull().default("scheduled"),
});

export const predictions = pgTable(
  "predictions",
  {
    participantId: integer("participant_id")
      .notNull()
      .references(() => participants.id),
    matchNum: integer("match_num")
      .notNull()
      .references(() => matches.num),
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.participantId, t.matchNum] })]
);

export const championPicks = pgTable("champion_picks", {
  participantId: integer("participant_id")
    .primaryKey()
    .references(() => participants.id),
  teamCode: text("team_code")
    .notNull()
    .references(() => teams.code),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// category: artilheiro | craque | zebra (e o que mais o admin inventar)
export const extraPicks = pgTable(
  "extra_picks",
  {
    participantId: integer("participant_id")
      .notNull()
      .references(() => participants.id),
    category: text("category").notNull(),
    value: text("value").notNull(),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.participantId, t.category] })]
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// badgeType: vidente | pe_frio | pe_quente | zebra_certa
export const badges = pgTable(
  "badges",
  {
    participantId: integer("participant_id")
      .notNull()
      .references(() => participants.id),
    badgeType: text("badge_type").notNull(),
    gameWeek: integer("game_week").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.participantId, t.badgeType, t.gameWeek] })]
);

// Subscriptions Web Push — uma linha por dispositivo/browser por participante
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id")
    .notNull()
    .references(() => participants.id),
  endpoint: text("endpoint").notNull().unique(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Duelos 1v1 simbolicos. Status: pending | accepted | declined | resolved
export const duels = pgTable("duels", {
  id: serial("id").primaryKey(),
  matchNum: integer("match_num")
    .notNull()
    .references(() => matches.num),
  challengerId: integer("challenger_id")
    .notNull()
    .references(() => participants.id),
  challengedId: integer("challenged_id")
    .notNull()
    .references(() => participants.id),
  status: text("status").notNull().default("pending"),
  markets: text("markets").notNull(),
  winnerParticipantId: integer("winner_participant_id").references(() => participants.id),
  resultSummary: text("result_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const duelPicks = pgTable(
  "duel_picks",
  {
    duelId: integer("duel_id")
      .notNull()
      .references(() => duels.id),
    participantId: integer("participant_id")
      .notNull()
      .references(() => participants.id),
    picks: text("picks").notNull(),
    points: integer("points").notNull().default(0),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.duelId, t.participantId] })]
);
