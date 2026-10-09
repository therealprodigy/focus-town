import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleApi } from "../server/room-service";
import { openDatabase } from "../server/sqlite";
import type { RoomSnapshot } from "../src/roomClient";
type Credentials = {
  roomId: string;
  memberId: string;
  token: string;
  invite: string;
};
type Reply = {
  credentials: Credentials;
  snapshot: RoomSnapshot;
  error?: string;
};
let db: ReturnType<typeof openDatabase>;
const now = Date.UTC(2026, 9, 9, 8);
beforeEach(() => {
  db = openDatabase();
});
afterEach(() => db.close());
async function call(
  path: string,
  data: unknown = {},
  c?: Credentials,
  at = now,
  extra: Record<string, string> = {},
) {
  const response = await handleApi(
    new Request("https://town.test/api/rooms" + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CF-Connecting-IP": "192.0.2.1",
        ...(c ? { Authorization: "Bearer " + c.token } : {}),
        ...extra,
      },
      body: JSON.stringify(data),
    }),
    { DB: db },
    at,
  );
  return { status: response.status, ...((await response.json()) as Reply) };
}
const create = async () => {
  const r = await call("", { name: "Host" });
  expect(r.status).toBe(201);
  return r;
};
const sync = (c: Credentials, at = now) =>
  call("/" + c.roomId + "/sync", {}, c, at);
const control = (
  c: Credentials,
  revision: number,
  action: string,
  at = now,
  kind: unknown = "focus",
  minutes = 1,
) =>
  call("/" + c.roomId + "/control", { revision, action, kind, minutes }, c, at);
describe("shared rooms with a real SQLite database", () => {
  it("creates an invitation, hashes capabilities, and gives members one shared timer", async () => {
    const host = await create(),
      guest = await call("/join", {
        name: "Mira",
        invite: host.credentials.invite,
      });
    expect(guest.status).toBe(201);
    const stored = await db
      .prepare("SELECT token_hash FROM members WHERE id=?")
      .bind(host.credentials.memberId)
      .first<{ token_hash: string }>();
    expect(stored?.token_hash).not.toBe(host.credentials.token);
    const started = await control(host.credentials, 0, "start");
    expect(started.status).toBe(200);
    const seen = await sync(guest.credentials, now + 1000);
    expect(seen.snapshot.timer).toMatchObject({
      kind: "focus",
      status: "running",
      endAt: now + 60000,
    });
    expect(seen.snapshot.members).toHaveLength(2);
    expect(JSON.stringify(seen.snapshot)).not.toContain("token");
    expect(JSON.stringify(seen.snapshot)).not.toContain("invite");
  });
  it("denies guests and invalid or cross-room tokens control", async () => {
    const host = await create(),
      guest = await call("/join", {
        name: "Guest",
        invite: host.credentials.invite,
      }),
      other = await create();
    expect((await control(guest.credentials, 0, "start")).status).toBe(403);
    expect(
      (await sync({ ...host.credentials, token: "a".repeat(64) })).status,
    ).toBe(401);
    expect(
      (await sync({ ...host.credentials, token: other.credentials.token }))
        .status,
    ).toBe(401);
  });
  it("serializes concurrent host controls and never counts a finished focus twice", async () => {
    const host = await create();
    const results = await Promise.all([
      control(host.credentials, 0, "start"),
      control(host.credentials, 0, "start"),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const finished = await Promise.all([
      sync(host.credentials, now + 60000),
      sync(host.credentials, now + 60000),
    ]);
    for (const r of finished) {
      expect(r.snapshot.sharedMinutes).toBe(1);
      expect(r.snapshot.timer?.status).toBe("complete");
    }
    const again = await sync(host.credentials, now + 120000);
    expect(again.snapshot.sharedMinutes).toBe(1);
    const rest = await control(
      host.credentials,
      again.snapshot.revision,
      "start",
      now + 120000,
      "short",
    );
    expect(rest.status).toBe(200);
    expect(
      (await sync(host.credentials, now + 180000)).snapshot.sharedMinutes,
    ).toBe(1);
  });
  it("freezes a paused deadline and resumes from the remaining time", async () => {
    const h = await create(),
      started = await control(h.credentials, 0, "start");
    const paused = await control(
      h.credentials,
      started.snapshot.revision,
      "pause",
      now + 15000,
    );
    expect(paused.snapshot.timer).toMatchObject({
      status: "paused",
      endAt: null,
      remainingMs: 45000,
    });
    const later = await sync(h.credentials, now + 3600000);
    expect(later.snapshot.timer?.remainingMs).toBe(45000);
    const resumed = await control(
      h.credentials,
      later.snapshot.revision,
      "resume",
      now + 3600000,
    );
    expect(resumed.snapshot.timer?.endAt).toBe(now + 3645000);
  });
  it("caps membership atomically at eight including the host", async () => {
    const h = await create();
    const joins = await Promise.all(
      Array.from({ length: 9 }, (_, i) =>
        call("/join", { name: "Guest " + i, invite: h.credentials.invite }),
      ),
    );
    expect(joins.filter((j) => j.status === 201)).toHaveLength(7);
    expect(joins.filter((j) => j.status === 403)).toHaveLength(2);
    expect((await sync(h.credentials)).snapshot.members).toHaveLength(8);
  });
  it("removes guests independently, and closing as host removes the entire room", async () => {
    const h = await create(),
      g = await call("/join", { name: "Guest", invite: h.credentials.invite });
    expect(
      (await call("/" + h.credentials.roomId + "/leave", {}, g.credentials))
        .status,
    ).toBe(200);
    expect((await sync(h.credentials)).snapshot.members).toHaveLength(1);
    expect(
      (await call("/" + h.credentials.roomId + "/leave", {}, h.credentials))
        .status,
    ).toBe(200);
    expect((await sync(h.credentials)).status).toBe(401);
    expect(
      await db.prepare("SELECT COUNT(*) AS n FROM members").first(),
    ).toMatchObject({ n: 0 });
  });
  it("expires membership and rejects old invitations after 24 hours", async () => {
    const h = await create();
    expect((await sync(h.credentials, now + 86400000)).status).toBe(401);
    expect(
      (
        await call(
          "/join",
          { name: "Late", invite: h.credentials.invite },
          undefined,
          now + 86400000,
        )
      ).status,
    ).toBe(403);
    expect(
      await db.prepare("SELECT COUNT(*) AS n FROM members").first(),
    ).toMatchObject({ n: 0 });
  });
  it("rejects foreign origins, malformed kinds and out-of-range minutes", async () => {
    expect(
      (
        await call("", { name: "Host" }, undefined, now, {
          Origin: "https://elsewhere.test",
        })
      ).status,
    ).toBe(403);
    const h = await create();
    for (const kind of [["focus"], {}, null, "wrong"])
      expect((await control(h.credentials, 0, "start", now, kind)).status).toBe(
        400,
      );
    for (const minutes of [0, 721, 1.5])
      expect(
        (await control(h.credentials, 0, "start", now, "focus", minutes))
          .status,
      ).toBe(400);
  });
  it("limits room creation and authenticated members independently behind one IP", async () => {
    const h = await create(),
      g = await call("/join", { name: "Guest", invite: h.credentials.invite });
    for (let i = 0; i < 120; i++)
      expect((await sync(h.credentials)).status).toBe(200);
    expect((await sync(h.credentials)).status).toBe(429);
    expect((await sync(g.credentials)).status).toBe(200);
    for (let i = 0; i < 4; i++)
      expect((await call("", { name: "Host" })).status).toBe(201);
    expect((await call("", { name: "Host" })).status).toBe(429);
  });
  it("validates companion positions, isolates identity and ignores stale updates", async () => {
    const h = await create(),
      g = await call("/join", { name: "Guest", invite: h.credentials.invite });
    const position = { scene: "village", x: 448, y: 416, facing: "right" };
    const send = (c: Credentials, seq: number, p: unknown) =>
      call(
        "/" + c.roomId + "/sync",
        { position: p, positionSeq: seq, memberId: h.credentials.memberId },
        c,
      );
    expect((await send(g.credentials, 2, position)).status).toBe(200);
    expect((await send(g.credentials, 1, { ...position, x: 200 })).status).toBe(
      200,
    );
    const seen = await sync(h.credentials);
    expect(
      seen.snapshot.members.find((m) => m.id === g.credentials.memberId),
    ).toMatchObject({
      position: { x: 448, y: 416, scene: "village" },
      positionSeq: 2,
    });
    expect(
      seen.snapshot.members.find((m) => m.id === h.credentials.memberId)
        ?.position,
    ).toBeNull();
    for (const patch of [
      { x: -1 },
      { x: 954 },
      { x: "448" },
      { y: 601 },
      { scene: ["village"] },
      { facing: "north" },
    ])
      expect(
        (await send(g.credentials, 3, { ...position, ...patch })).status,
      ).toBe(400);
    expect(
      (
        await send(g.credentials, 3, {
          ...position,
          scene: "house",
          x: 480,
          y: 468,
        })
      ).status,
    ).toBe(200);
    expect(
      (await sync(h.credentials)).snapshot.members.find(
        (m) => m.id === g.credentials.memberId,
      )?.position?.scene,
    ).toBe("house");
    expect(
      (await sync(h.credentials, now + 31000)).snapshot.members.find(
        (m) => m.id === g.credentials.memberId,
      )?.online,
    ).toBe(false);
  });
  it("rejects oversized bodies and reports missing storage honestly", async () => {
    expect((await call("", { name: "x".repeat(5000) })).status).toBe(413);
    const r = await handleApi(
      new Request("https://town.test/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
      {},
      now,
    );
    expect(r.status).toBe(503);
  });
});
