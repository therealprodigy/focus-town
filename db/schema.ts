import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  secretHash: text("secret_hash").notNull().unique(),
  name: text("name").notNull(),
  reportedMinutes: integer("reported_minutes").notNull().default(0),
  reportedStreak: integer("reported_streak").notNull().default(0),
  upgrades: text("upgrades").notNull().default("[]"),
  revision: integer("revision").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});
export const rooms = sqliteTable(
  "rooms",
  {
    id: text("id").primaryKey(),
    ownerProfileId: text("owner_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    activeSessionId: text("active_session_id"),
    lastOperationId: text("last_operation_id"),
    inviteHash: text("invite_hash").notNull().unique(),
    hostMemberId: text("host_member_id").notNull(),
    expiresAt: integer("expires_at").notNull(),
    revision: integer("revision").notNull().default(0),
    kind: text("kind"),
    status: text("status").notNull().default("idle"),
    minutes: integer("minutes").notNull().default(0),
    endAt: integer("end_at"),
    remaining: integer("remaining").notNull().default(0),
    sharedMinutes: integer("shared_minutes").notNull().default(0),
  },
  (t) => [index("rooms_expiry").on(t.expiresAt)],
);
export const members = sqliteTable(
  "members",
  {
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    profileId: text("profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    ready: integer("ready").notNull().default(0),
    tokenHash: text("token_hash").notNull().unique(),
    name: text("name").notNull(),
    lastSeen: integer("last_seen").notNull(),
    position: text("position"),
    positionSeq: integer("position_seq").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.roomId, t.id] }),
    index("members_profile_id").on(t.profileId),
  ],
);
export const limits = sqliteTable(
  "request_limits",
  {
    key: text("key").primaryKey(),
    hits: integer("hits").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (t) => [index("limits_expiry").on(t.expiresAt)],
);

export const socialPairs = sqliteTable(
  "social_pairs",
  {
    lowProfileId: text("low_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    highProfileId: text("high_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    leaderProfileId: text("leader_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.lowProfileId, t.highProfileId] })],
);
export const focusSessions = sqliteTable(
  "focus_sessions",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id").references(() => rooms.id, {
      onDelete: "set null",
    }),
    minutes: integer("minutes").notNull(),
    startedAt: integer("started_at").notNull(),
    dueAt: integer("due_at"),
    remainingMs: integer("remaining_ms").notNull(),
    status: text("status").notNull(),
    completedAt: integer("completed_at"),
  },
  (t) => [index("focus_sessions_due").on(t.status, t.dueAt)],
);
export const sessionParticipants = sqliteTable(
  "session_participants",
  {
    sessionId: text("session_id")
      .notNull()
      .references(() => focusSessions.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    forfeited: integer("forfeited").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.sessionId, t.profileId] }),
    index("session_participants_profile").on(t.profileId),
  ],
);
export const rewardGrants = sqliteTable(
  "reward_grants",
  {
    sessionId: text("session_id")
      .notNull()
      .references(() => focusSessions.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    minutes: integer("minutes").notNull(),
    completedAt: integer("completed_at").notNull(),
    coins: integer("coins").notNull(),
    xp: integer("xp").notNull(),
    energy: integer("energy").notNull(),
    acknowledgedAt: integer("acknowledged_at"),
  },
  (t) => [
    primaryKey({ columns: [t.sessionId, t.profileId] }),
    index("reward_grants_pending").on(t.profileId, t.acknowledgedAt),
  ],
);
