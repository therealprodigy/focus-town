import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";
export const rooms = sqliteTable(
  "rooms",
  {
    id: text("id").primaryKey(),
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
    tokenHash: text("token_hash").notNull().unique(),
    name: text("name").notNull(),
    lastSeen: integer("last_seen").notNull(),
    position: text("position"),
    positionSeq: integer("position_seq").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.roomId, t.id] })],
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
