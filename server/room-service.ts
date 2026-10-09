export type SqlResult = {
  meta: { changes: number };
  results?: Record<string, unknown>[];
};
export interface Statement {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<SqlResult>;
}
export interface Database {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<SqlResult[]>;
}
export type Env = { DB?: Database };
type RoomRow = {
  id: string;
  host_member_id: string;
  expires_at: number;
  revision: number;
  kind: "focus" | "short" | "long" | null;
  status: "idle" | "running" | "paused" | "complete";
  minutes: number;
  end_at: number | null;
  remaining: number;
  shared_minutes: number;
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
const token = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
const hash = async (value: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
const newId = () => crypto.randomUUID().replaceAll("-", "");
class Problem extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
async function body(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Problem("Use a JSON request.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new Problem("Missing request.");
  let size = 0,
    raw = "";
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 4096) {
      await reader.cancel();
      throw new Problem("Request too large.", 413);
    }
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw Error();
    return value as Record<string, unknown>;
  } catch {
    throw new Problem("Invalid request.");
  }
}
const nickname = (value: unknown) => {
  if (typeof value !== "string") throw new Problem("Choose a nickname.");
  const n = value.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").trim();
  if (!n || n.length > 24)
    throw new Problem("Use a nickname of 1 to 24 characters.");
  return n;
};
const readRoom = (db: Database, id: string) =>
  db.prepare("SELECT * FROM rooms WHERE id=?").bind(id).first<RoomRow>();
async function snapshot(
  db: Database,
  id: string,
  now: number,
  responseTime = () => now,
) {
  let r = await readRoom(db, id);
  if (!r || r.expires_at <= now)
    throw new Problem("This room has closed or expired.", 404);
  if (r.status === "running" && r.end_at !== null && r.end_at <= now) {
    await db
      .prepare(
        "UPDATE rooms SET status='complete',remaining=0,end_at=NULL,shared_minutes=shared_minutes+CASE WHEN kind='focus' THEN minutes ELSE 0 END,revision=revision+1 WHERE id=? AND revision=? AND status='running' AND end_at<=?",
      )
      .bind(id, r.revision, now)
      .run();
    r = await readRoom(db, id);
    if (!r) throw new Problem("This room has closed.", 404);
  }
  const roster = await db
    .prepare(
      "SELECT id,name,last_seen,position,position_seq FROM members WHERE room_id=? ORDER BY last_seen DESC",
    )
    .bind(id)
    .all<{
      id: string;
      name: string;
      last_seen: number;
      position: string | null;
      position_seq: number;
    }>();
  return {
    id: r.id,
    hostId: r.host_member_id,
    revision: r.revision,
    serverNow: responseTime(),
    expiresAt: r.expires_at,
    sharedMinutes: r.shared_minutes,
    timer: r.kind
      ? {
          kind: r.kind,
          status: r.status,
          minutes: r.minutes,
          endAt: r.end_at,
          remainingMs: r.remaining,
        }
      : null,
    members: roster.results.map((m) => ({
      id: m.id,
      name: m.name,
      online: m.last_seen >= now - 30000,
      position: m.position ? JSON.parse(m.position) : null,
      positionSeq: m.position_seq,
    })),
  };
}
async function authenticate(
  request: Request,
  db: Database,
  id: string,
  now: number,
) {
  const raw = request.headers
    .get("Authorization")
    ?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!raw) throw new Problem("This room could not be opened.", 401);
  const tokenHash = await hash(raw);
  const m = await db
    .prepare(
      "SELECT m.id,m.room_id,r.host_member_id FROM members m JOIN rooms r ON r.id=m.room_id WHERE m.token_hash=? AND m.room_id=? AND r.expires_at>?",
    )
    .bind(tokenHash, id, now)
    .first<{ id: string; room_id: string; host_member_id: string }>();
  if (!m) throw new Problem("This room could not be opened.", 401);
  return { ...m, tokenHash };
}
async function rateLimit(
  request: Request,
  db: Database,
  path: string,
  now: number,
  member?: string,
) {
  const category =
    path === "/api/rooms"
      ? "create"
      : path === "/api/rooms/join"
        ? "join"
        : "room";
  const bucket = Math.floor(now / 60000),
    key = await hash(
      (member ?? request.headers.get("CF-Connecting-IP") ?? "local") +
        ":" +
        bucket +
        ":" +
        category,
    );
  const result = await db
    .prepare(
      "INSERT INTO request_limits (key,hits,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits",
    )
    .bind(key, now + 120000)
    .first<{ hits: number }>();
  const max =
    category === "create" ? 5 : category === "join" ? 15 : member ? 120 : 2400;
  if (!result || result.hits > max)
    throw new Problem("Too many requests. Wait a minute and try again.", 429);
}
export async function handleApi(
  request: Request,
  env: Env,
  suppliedNow?: number,
): Promise<Response> {
  try {
    const now = suppliedNow ?? Date.now(),
      responseTime = () => suppliedNow ?? Date.now();
    const url = new URL(request.url),
      path = url.pathname.replace(/\/$/, "");
    if (request.method !== "POST")
      return json({ error: "Method not allowed." }, 405);
    if (
      request.headers.has("Origin") &&
      request.headers.get("Origin") !== url.origin
    )
      return json({ error: "Use the room from its own site." }, 403);
    if (!env.DB)
      return json(
        {
          error:
            "Co-op is available in the hosted version. Solo sessions work on this device.",
        },
        503,
      );
    const db = env.DB,
      data = await body(request);
    await rateLimit(request, db, path, now);
    if (path === "/api/rooms" || path === "/api/rooms/join") {
      await db.batch([
        db.prepare("DELETE FROM rooms WHERE expires_at<=?").bind(now),
        db.prepare("DELETE FROM request_limits WHERE expires_at<=?").bind(now),
      ]);
      const name = nickname(data.name),
        memberId = newId(),
        rawToken = token(),
        tokenHash = await hash(rawToken);
      if (path === "/api/rooms") {
        const roomId = newId(),
          secret = token();
        await db.batch([
          db
            .prepare(
              "INSERT INTO rooms (id,invite_hash,host_member_id,expires_at) VALUES (?,?,?,?)",
            )
            .bind(roomId, await hash(secret), memberId, now + 86400000),
          db
            .prepare(
              "INSERT INTO members (room_id,id,token_hash,name,last_seen) VALUES (?,?,?,?,?)",
            )
            .bind(roomId, memberId, tokenHash, name, now),
        ]);
        return json(
          {
            credentials: {
              roomId,
              memberId,
              token: rawToken,
              invite: roomId + "." + secret,
            },
            snapshot: await snapshot(db, roomId, now, responseTime),
          },
          201,
        );
      }
      const invite =
        typeof data.invite === "string"
          ? data.invite.match(/^([a-f0-9]{32})\.([a-f0-9]{64})$/)
          : null;
      if (!invite) throw new Problem("That invitation is not valid.");
      const id = invite[1],
        secretHash = await hash(invite[2]);
      const result = await db
        .prepare(
          "INSERT INTO members (room_id,id,token_hash,name,last_seen) SELECT id,?,?,?,? FROM rooms WHERE id=? AND invite_hash=? AND expires_at>? AND (SELECT COUNT(*) FROM members WHERE room_id=rooms.id)<8",
        )
        .bind(memberId, tokenHash, name, now, id, secretHash, now)
        .run();
      if (result.meta.changes !== 1)
        throw new Problem(
          "The invitation is invalid, expired, or the room is full.",
          403,
        );
      return json(
        {
          credentials: { roomId: id, memberId, token: rawToken },
          snapshot: await snapshot(db, id, now, responseTime),
        },
        201,
      );
    }
    const match = path.match(
      /^\/api\/rooms\/([a-f0-9]{32})\/(sync|control|leave)$/,
    );
    if (!match) return json({ error: "Room route not found." }, 404);
    const [, id, action] = match,
      m = await authenticate(request, db, id, now);
    await rateLimit(request, db, path, now, m.id);
    if (action === "leave") {
      if (m.id === m.host_member_id)
        await db
          .prepare("DELETE FROM rooms WHERE id=? AND host_member_id=?")
          .bind(id, m.id)
          .run();
      else
        await db
          .prepare("DELETE FROM members WHERE room_id=? AND id=?")
          .bind(id, m.id)
          .run();
      return json({ left: true });
    }
    await db
      .prepare("UPDATE members SET last_seen=? WHERE room_id=? AND id=?")
      .bind(now, id, m.id)
      .run();
    if (action === "sync") {
      if (data.position !== undefined) {
        const p = data.position as Record<string, unknown>;
        if (
          !p ||
          typeof p !== "object" ||
          Array.isArray(p) ||
          typeof p.scene !== "string" ||
          !["village", "house"].includes(p.scene) ||
          typeof p.facing !== "string" ||
          !["up", "down", "left", "right"].includes(p.facing) ||
          typeof p.x !== "number" ||
          !Number.isFinite(p.x) ||
          p.x < 7 ||
          p.x > 953 ||
          typeof p.y !== "number" ||
          !Number.isFinite(p.y) ||
          p.y < 10 ||
          p.y > 600 ||
          !Number.isSafeInteger(data.positionSeq) ||
          Number(data.positionSeq) < 1
        )
          throw new Problem("Invalid town position.");
        const position = JSON.stringify({
          scene: p.scene,
          x: p.x,
          y: p.y,
          facing: p.facing,
          updatedAt: now,
        });
        await db
          .prepare(
            "UPDATE members SET position=CASE WHEN position_seq<? THEN ? ELSE position END,position_seq=MAX(position_seq,?) WHERE room_id=? AND id=?",
          )
          .bind(data.positionSeq, position, data.positionSeq, id, m.id)
          .run();
      }
      return json({ snapshot: await snapshot(db, id, now, responseTime) });
    }
    if (m.id !== m.host_member_id)
      throw new Problem("Only the host can change this timer.", 403);
    await snapshot(db, id, now, responseTime);
    const r = await readRoom(db, id);
    if (!r) throw new Problem("This room has closed.", 404);
    if (!Number.isSafeInteger(data.revision) || data.revision !== r.revision)
      throw new Problem(
        "The room changed. Wait for it to sync and try again.",
        409,
      );
    let kind = r.kind,
      status = r.status,
      minutes = r.minutes,
      endAt = r.end_at,
      remaining = r.remaining;
    if (data.action === "start") {
      if (status === "running" || status === "paused")
        throw new Problem("End the current interval first.", 409);
      if (
        typeof data.kind !== "string" ||
        !["focus", "short", "long"].includes(data.kind) ||
        !Number.isSafeInteger(data.minutes) ||
        Number(data.minutes) < 1 ||
        Number(data.minutes) > 720
      )
        throw new Problem("Choose 1 to 720 whole minutes.");
      kind = data.kind as RoomRow["kind"];
      minutes = Number(data.minutes);
      remaining = minutes * 60000;
      endAt = now + remaining;
      status = "running";
    } else if (data.action === "pause" && status === "running") {
      remaining = Math.max(0, (endAt ?? now) - now);
      endAt = null;
      status = "paused";
    } else if (data.action === "resume" && status === "paused") {
      endAt = now + remaining;
      status = "running";
    } else if (data.action === "reset") {
      kind = null;
      status = "idle";
      minutes = 0;
      remaining = 0;
      endAt = null;
    } else throw new Problem("That timer action is unavailable.", 409);
    const changed = await db
      .prepare(
        "UPDATE rooms SET kind=?,status=?,minutes=?,end_at=?,remaining=?,revision=revision+1 WHERE id=? AND revision=? AND expires_at>? AND EXISTS (SELECT 1 FROM members WHERE room_id=rooms.id AND id=rooms.host_member_id AND token_hash=?)",
      )
      .bind(
        kind,
        status,
        minutes,
        endAt,
        remaining,
        id,
        r.revision,
        now,
        m.tokenHash,
      )
      .run();
    if (changed.meta.changes !== 1)
      throw new Problem(
        "The room changed. Wait for it to sync and try again.",
        409,
      );
    return json({ snapshot: await snapshot(db, id, now, responseTime) });
  } catch (e) {
    return json(
      {
        error:
          e instanceof Problem
            ? e.message
            : "The room service is unavailable. Try again shortly.",
      },
      e instanceof Problem ? e.status : 503,
    );
  }
}
