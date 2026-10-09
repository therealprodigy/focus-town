import type { Database } from "./room-service";
import { getRewards } from "../src/game/state";
export class SharedFocusError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}
type Room = {
  id: string;
  revision: number;
  expires_at: number;
  active_session_id: string | null;
  status: "idle" | "running" | "paused" | "complete";
  end_at: number | null;
  remaining: number;
};
export type HostCommand = {
  roomId: string;
  memberId: string;
  tokenHash: string;
  revision: number;
  now: number;
};
const uuid = () => crypto.randomUUID().replaceAll("-", "");
const roomById = (db: Database, id: string) =>
  db.prepare("SELECT * FROM rooms WHERE id=?").bind(id).first<Room>();
export async function setMemberReady(
  db: Database,
  roomId: string,
  memberId: string,
  ready: unknown,
  now: number,
) {
  if (typeof ready !== "boolean")
    throw new SharedFocusError("Choose ready or not ready.");
  const r = await db
    .prepare(
      "UPDATE members SET ready=?,last_seen=? WHERE room_id=? AND id=? AND profile_id IS NOT NULL AND EXISTS (SELECT 1 FROM rooms WHERE id=members.room_id AND expires_at>? AND status IN ('idle','complete'))",
    )
    .bind(ready ? 1 : 0, now, roomId, memberId, now)
    .run();
  if (r.meta.changes !== 1)
    throw new SharedFocusError(
      "Set readiness before the next interval starts.",
      409,
    );
}
export async function startSharedFocus(
  db: Database,
  c: HostCommand,
  minutes: unknown,
) {
  if (
    !Number.isSafeInteger(minutes) ||
    Number(minutes) < 1 ||
    Number(minutes) > 720
  )
    throw new SharedFocusError("Choose 1 to 720 whole minutes.");
  const duration = Number(minutes) * 60000,
    end = c.now + duration,
    id = uuid(),
    op = uuid(),
    cutoff = c.now - 30000;
  const result = await db.batch([
    db
      .prepare(
        "UPDATE rooms SET kind='focus',status='running',minutes=?,end_at=?,remaining=?,active_session_id=?,last_operation_id=?,revision=revision+1 WHERE id=? AND revision=? AND status IN ('idle','complete') AND expires_at>=? AND EXISTS (SELECT 1 FROM members WHERE room_id=rooms.id AND id=rooms.host_member_id AND id=? AND token_hash=? AND ready=1 AND profile_id IS NOT NULL AND last_seen>=?) AND NOT EXISTS (SELECT 1 FROM members WHERE room_id=rooms.id AND last_seen>=? AND (ready<>1 OR profile_id IS NULL))",
      )
      .bind(
        minutes,
        end,
        duration,
        id,
        op,
        c.roomId,
        c.revision,
        end,
        c.memberId,
        c.tokenHash,
        cutoff,
        cutoff,
      ),
    db
      .prepare(
        "INSERT INTO focus_sessions (id,room_id,minutes,started_at,due_at,remaining_ms,status) SELECT ?,id,?,?,?,?,'running' FROM rooms WHERE id=? AND last_operation_id=?",
      )
      .bind(id, minutes, c.now, end, duration, c.roomId, op),
    db
      .prepare(
        "INSERT INTO session_participants (session_id,profile_id,forfeited) SELECT DISTINCT ?,m.profile_id,0 FROM members m JOIN rooms r ON r.id=m.room_id WHERE r.id=? AND r.last_operation_id=? AND m.ready=1 AND m.last_seen>=? AND m.profile_id IS NOT NULL",
      )
      .bind(id, c.roomId, op, cutoff),
    db
      .prepare(
        "UPDATE members SET ready=0 WHERE room_id=? AND EXISTS (SELECT 1 FROM rooms WHERE id=members.room_id AND last_operation_id=?)",
      )
      .bind(c.roomId, op),
  ]);
  if (result[0].meta.changes !== 1)
    throw new SharedFocusError(
      "Someone is not ready, the room changed, or it expires too soon.",
      409,
    );
  return id;
}
export async function settleSharedSession(
  db: Database,
  id: string,
  now: number,
) {
  const s = await db
    .prepare("SELECT id,minutes,status FROM focus_sessions WHERE id=?")
    .bind(id)
    .first<{ id: string; minutes: number; status: string }>();
  if (!s || s.status === "cancelled") return;
  const r = getRewards(s.minutes);
  await db.batch([
    db
      .prepare(
        "UPDATE focus_sessions SET status='completed',completed_at=due_at,remaining_ms=0 WHERE id=? AND status='running' AND due_at IS NOT NULL AND due_at<=?",
      )
      .bind(id, now),
    db
      .prepare(
        "INSERT INTO reward_grants (session_id,profile_id,minutes,completed_at,coins,xp,energy) SELECT s.id,p.profile_id,s.minutes,s.completed_at,?,?,? FROM focus_sessions s JOIN session_participants p ON p.session_id=s.id WHERE s.id=? AND s.status='completed' AND s.completed_at IS NOT NULL AND p.forfeited=0 ON CONFLICT(session_id,profile_id) DO NOTHING",
      )
      .bind(r.coins, r.xp, r.energy, id),
    db
      .prepare(
        "UPDATE rooms SET status='complete',remaining=0,end_at=NULL,shared_minutes=shared_minutes+?,revision=revision+1 WHERE active_session_id=? AND kind='focus' AND status='running' AND EXISTS (SELECT 1 FROM focus_sessions WHERE id=? AND status='completed')",
      )
      .bind(s.minutes, id, id),
  ]);
}
export async function settleRoomFocus(db: Database, id: string, now: number) {
  const room = await roomById(db, id);
  if (room?.active_session_id)
    await settleSharedSession(db, room.active_session_id, now);
}
export async function controlSharedFocus(
  db: Database,
  c: HostCommand,
  action: "pause" | "resume" | "reset",
) {
  await settleRoomFocus(db, c.roomId, c.now);
  const r = await roomById(db, c.roomId);
  if (!r || !r.active_session_id || r.revision !== c.revision)
    throw new SharedFocusError("The room changed. Sync and try again.", 409);
  let roomStatus: string,
    sessionStatus: string,
    remaining: number,
    due: number | null;
  if (action === "pause" && r.status === "running") {
    roomStatus = "paused";
    sessionStatus = "paused";
    remaining = Math.max(0, (r.end_at ?? c.now) - c.now);
    due = null;
  } else if (action === "resume" && r.status === "paused") {
    roomStatus = "running";
    sessionStatus = "running";
    remaining = r.remaining;
    due = c.now + remaining;
    if (due > r.expires_at)
      throw new SharedFocusError(
        "This room expires before the interval can finish.",
      );
  } else if (action === "reset") {
    roomStatus = "idle";
    sessionStatus = "cancelled";
    remaining = 0;
    due = null;
  } else throw new SharedFocusError("That timer action is unavailable.", 409);
  const op = uuid(),
    reset = action === "reset" ? 1 : 0;
  const result = await db.batch([
    db
      .prepare(
        "UPDATE rooms SET status=?,end_at=?,remaining=?,kind=CASE WHEN ?=1 THEN NULL ELSE kind END,minutes=CASE WHEN ?=1 THEN 0 ELSE minutes END,active_session_id=CASE WHEN ?=1 THEN NULL ELSE active_session_id END,last_operation_id=?,revision=revision+1 WHERE id=? AND revision=? AND expires_at>? AND active_session_id=? AND EXISTS (SELECT 1 FROM members WHERE room_id=rooms.id AND id=rooms.host_member_id AND id=? AND token_hash=?)",
      )
      .bind(
        roomStatus,
        due,
        remaining,
        reset,
        reset,
        reset,
        op,
        c.roomId,
        c.revision,
        c.now,
        r.active_session_id,
        c.memberId,
        c.tokenHash,
      ),
    db
      .prepare(
        "UPDATE focus_sessions SET status=?,due_at=?,remaining_ms=? WHERE id=? AND status IN ('running','paused') AND EXISTS (SELECT 1 FROM rooms WHERE id=? AND last_operation_id=?)",
      )
      .bind(sessionStatus, due, remaining, r.active_session_id, c.roomId, op),
  ]);
  if (result[0].meta.changes !== 1)
    throw new SharedFocusError("The room changed. Sync and try again.", 409);
}
export async function pendingSharedGrants(
  db: Database,
  profileId: string,
  now: number,
) {
  const due = await db
    .prepare(
      "SELECT s.id FROM focus_sessions s JOIN session_participants p ON p.session_id=s.id WHERE p.profile_id=? AND p.forfeited=0 AND s.status='running' AND s.due_at<=? ORDER BY s.due_at,s.id LIMIT 32",
    )
    .bind(profileId, now)
    .all<{ id: string }>();
  for (const s of due.results) await settleSharedSession(db, s.id, now);
  const grants = await db
    .prepare(
      "SELECT session_id,minutes,completed_at,coins,xp,energy FROM reward_grants WHERE profile_id=? AND acknowledged_at IS NULL ORDER BY completed_at,session_id LIMIT 32",
    )
    .bind(profileId)
    .all<{
      session_id: string;
      minutes: number;
      completed_at: number;
      coins: number;
      xp: number;
      energy: number;
    }>();
  return grants.results.map((g) => ({
    id: g.session_id,
    minutes: g.minutes,
    completedAt: g.completed_at,
    rewards: { coins: g.coins, xp: g.xp, energy: g.energy },
  }));
}
export async function acknowledgeSharedGrants(
  db: Database,
  profileId: string,
  ids: unknown,
  now: number,
) {
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > 32 ||
    !ids.every((x) => typeof x === "string" && /^[a-f0-9]{32}$/.test(x)) ||
    new Set(ids).size !== ids.length
  )
    throw new SharedFocusError("Invalid reward acknowledgements.");
  await db
    .prepare(
      "UPDATE reward_grants SET acknowledged_at=COALESCE(acknowledged_at,?) WHERE profile_id=? AND session_id IN (" +
        ids.map(() => "?").join(",") +
        ")",
    )
    .bind(now, profileId, ...ids)
    .run();
}
