import type { Database } from "./room-service.js";
import { validUpgrades, type UpgradeId } from "../src/game/townCatalog.js";
import { pendingSharedGrants, acknowledgeSharedGrants } from "./shared-focus.js";
export class SocialError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}
export type Profile = {
  id: string;
  secret_hash: string;
  name: string;
  reported_minutes: number;
  reported_streak: number;
  upgrades: string;
  revision: number;
  updated_at: number;
};
const hash = async (s: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    ),
    (n) => n.toString(16).padStart(2, "0"),
  ).join("");
const validSecret = (x: unknown): x is string =>
  typeof x === "string" && /^[a-f0-9]{64}$/.test(x);
const nameOf = (x: unknown) => {
  if (typeof x !== "string") throw new SocialError("Choose a nickname.");
  const n = x.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").trim();
  if (!n || n.length > 24)
    throw new SocialError("Use a name of 1 to 24 characters.");
  return n;
};
const upgrades = (raw: string): UpgradeId[] => {
  try {
    const a: unknown = JSON.parse(raw);
    return validUpgrades(a) ? a : [];
  } catch {
    return [];
  }
};
const publicProfile = (p: Profile) => ({
  id: p.id,
  name: p.name,
  totalMinutes: p.reported_minutes,
  streak: p.reported_streak,
  upgrades: upgrades(p.upgrades),
  revision: p.revision,
});
export async function authenticateProfile(db: Database, secret: unknown) {
  if (!validSecret(secret))
    throw new SocialError("Reconnect your device profile.", 401);
  const p = await db
    .prepare("SELECT * FROM profiles WHERE secret_hash=?")
    .bind(await hash(secret))
    .first<Profile>();
  if (!p) throw new SocialError("Reconnect your device profile.", 401);
  return p;
}
async function limit(
  db: Database,
  identity: string,
  category: string,
  max: number,
  now: number,
) {
  const k = await hash(
    "profile:" + category + ":" + identity + ":" + Math.floor(now / 60000),
  );
  const r = await db
    .prepare(
      "INSERT INTO request_limits (key,hits,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits",
    )
    .bind(k, now + 120000)
    .first<{ hits: number }>();
  if (!r || r.hits > max)
    throw new SocialError("Too many requests. Try again shortly.", 429);
}
export async function handleProfile(
  request: Request,
  db: Database,
  path: string,
  data: Record<string, unknown>,
  now: number,
): Promise<{ data: unknown; status?: number }> {
  if (
    ![
      "/api/profile/create",
      "/api/profile/report",
      "/api/profile/grants",
      "/api/profile/grants/ack",
    ].includes(path)
  )
    throw new SocialError("Profile route not found.", 404);
  const raw = request.headers
    .get("Authorization")
    ?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (path.endsWith("/create")) {
    await limit(
      db,
      request.headers.get("CF-Connecting-IP") ?? "local",
      "create",
      20,
      now,
    );
    if (!validSecret(raw))
      throw new SocialError("Provide a device profile secret.", 401);
    const name = nameOf(data.name),
      secretHash = await hash(raw);
    const result = await db
      .prepare(
        "INSERT INTO profiles (id,secret_hash,name,reported_minutes,reported_streak,upgrades,revision,updated_at) VALUES (?,?,?,0,0,'[]',0,?) ON CONFLICT(secret_hash) DO NOTHING",
      )
      .bind(crypto.randomUUID().replaceAll("-", ""), secretHash, name, now)
      .run();
    const p = await authenticateProfile(db, raw);
    return {
      data: { profile: publicProfile(p) },
      status: result.meta.changes === 1 ? 201 : 200,
    };
  }
  const p = await authenticateProfile(db, raw);
  await limit(db, p.id, path, 30, now);
  if (path.endsWith("/grants"))
    return { data: { grants: await pendingSharedGrants(db, p.id, now) } };
  if (path.endsWith("/grants/ack")) {
    await acknowledgeSharedGrants(db, p.id, data.ids, now);
    return { data: { acknowledged: true } };
  }
  const name = nameOf(data.name),
    valid = (v: unknown, max: number) =>
      Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  if (
    !valid(data.totalMinutes, 10000000) ||
    !valid(data.streak, 36500) ||
    !valid(data.revision, Number.MAX_SAFE_INTEGER - 1) ||
    !validUpgrades(data.upgrades)
  )
    throw new SocialError("That profile report is not valid.");
  const result = await db
    .prepare(
      "UPDATE profiles SET name=?,reported_minutes=MAX(reported_minutes,?),reported_streak=?,upgrades=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND secret_hash=?",
    )
    .bind(
      name,
      data.totalMinutes,
      data.streak,
      JSON.stringify(data.upgrades),
      now,
      p.id,
      data.revision,
      p.secret_hash,
    )
    .run();
  const current = await authenticateProfile(db, raw);
  return {
    status: result.meta.changes === 1 ? 200 : 409,
    data: {
      profile: publicProfile(current),
      ...(result.meta.changes === 1
        ? {}
        : { error: "Your profile changed. Refresh before reporting again." }),
    },
  };
}
const present =
  "SELECT DISTINCT profile_id FROM members WHERE room_id=? AND last_seen>=? AND profile_id IS NOT NULL";
export async function roomSocial(
  db: Database,
  roomId: string,
  viewerMemberId: string,
  now: number,
) {
  const membership = await db
    .prepare(
      "SELECT r.owner_profile_id FROM rooms r JOIN members m ON m.room_id=r.id WHERE r.id=? AND m.id=? AND r.expires_at>?",
    )
    .bind(roomId, viewerMemberId, now)
    .first<{ owner_profile_id: string | null }>();
  if (!membership) throw new SocialError("This room could not be opened.", 401);
  const cutoff = now - 30000;
  await db
    .prepare(
      "INSERT INTO social_pairs (low_profile_id,high_profile_id,leader_profile_id,updated_at) SELECT low.id,high.id,CASE WHEN low.reported_minutes>high.reported_minutes THEN low.id WHEN high.reported_minutes>low.reported_minutes THEN high.id ELSE NULL END,? FROM profiles low JOIN profiles high ON low.id<high.id WHERE low.id IN (" +
        present +
        ") AND high.id IN (" +
        present +
        ") ON CONFLICT(low_profile_id,high_profile_id) DO UPDATE SET leader_profile_id=excluded.leader_profile_id,updated_at=excluded.updated_at WHERE excluded.leader_profile_id IS NOT NULL AND excluded.leader_profile_id IS NOT social_pairs.leader_profile_id",
    )
    .bind(now, roomId, cutoff, roomId, cutoff)
    .run();
  const [people, pairs, owner] = await Promise.all([
    db
      .prepare(
        "SELECT id,name,reported_minutes,reported_streak FROM profiles WHERE id IN (" +
          present +
          ") ORDER BY id",
      )
      .bind(roomId, cutoff)
      .all<{
        id: string;
        name: string;
        reported_minutes: number;
        reported_streak: number;
      }>(),
    db
      .prepare(
        "SELECT * FROM social_pairs WHERE low_profile_id IN (" +
          present +
          ") AND high_profile_id IN (" +
          present +
          ")",
      )
      .bind(roomId, cutoff, roomId, cutoff)
      .all<{
        low_profile_id: string;
        high_profile_id: string;
        leader_profile_id: string | null;
      }>(),
    membership.owner_profile_id
      ? db
          .prepare("SELECT * FROM profiles WHERE id=?")
          .bind(membership.owner_profile_id)
          .first<Profile>()
      : Promise.resolve(null),
  ]);
  return {
    world: {
      ownerProfileId: owner?.id ?? null,
      upgrades: owner ? upgrades(owner.upgrades) : [],
      revision: owner?.revision ?? 0,
    },
    people: people.results.map((p) => ({
      id: p.id,
      name: p.name,
      totalMinutes: p.reported_minutes,
      streak: p.reported_streak,
    })),
    comparisons: pairs.results.map((p) => ({
      lowProfileId: p.low_profile_id,
      highProfileId: p.high_profile_id,
      leaderProfileId: p.leader_profile_id,
    })),
  };
}
