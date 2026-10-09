import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { openTestDatabase } from "./database";
import { handleApi } from "../server/room-service";
import { roomSocial } from "../server/social";
import {
  setMemberReady,
  startSharedFocus,
  controlSharedFocus,
  settleSharedSession,
  pendingSharedGrants,
  acknowledgeSharedGrants,
} from "../server/shared-focus";
const NOW = 1000000;
let db: Awaited<ReturnType<typeof openTestDatabase>>, sequence: number;
const id = () => (++sequence).toString(16).padStart(32, "0");
const req = (path: string, token: string, body: unknown) =>
  new Request("https://focus.test" + path, {
    method: "POST",
    headers: {
      Origin: "https://focus.test",
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
      "CF-Connecting-IP": "192.0.2.10",
    },
    body: JSON.stringify(body),
  });
const api = (path: string, token: string, body: unknown, now = NOW) =>
  handleApi(req(path, token, body), { DB: db }, now);
const digest = async (s: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    ),
    (v) => v.toString(16).padStart(2, "0"),
  ).join("");
type Profile = { id: string; token: string; name: string; revision: number };
async function profile(c: string, name: string): Promise<Profile> {
  const token = c.repeat(64),
    r = await api("/api/profile/create", token, { name });
  expect(r.status).toBe(201);
  return { ...(await r.json()).profile, token };
}
async function report(
  p: Profile,
  totalMinutes: number,
  upgrades: string[] = [],
) {
  const r = await api("/api/profile/report", p.token, {
    name: p.name,
    totalMinutes,
    upgrades,
    streak: 3,
    revision: p.revision,
  });
  expect(r.status).toBe(200);
  const data = (await r.json()).profile;
  p.revision = data.revision;
  return data;
}
async function room(host: Profile, guest: Profile, expiry = NOW + 86400000) {
  const roomId = id(),
    hostId = id(),
    guestId = id(),
    hostToken = "c".repeat(64),
    guestToken = "d".repeat(64),
    hash = await digest(hostToken);
  await db.batch([
    db
      .prepare(
        "INSERT INTO rooms (id,invite_hash,host_member_id,expires_at,owner_profile_id) VALUES (?,?,?,?,?)",
      )
      .bind(roomId, "invite-" + roomId, hostId, expiry, host.id),
    db
      .prepare(
        "INSERT INTO members (room_id,id,token_hash,name,last_seen,profile_id) VALUES (?,?,?,?,?,?)",
      )
      .bind(roomId, hostId, hash, host.name, NOW, host.id),
    db
      .prepare(
        "INSERT INTO members (room_id,id,token_hash,name,last_seen,profile_id) VALUES (?,?,?,?,?,?)",
      )
      .bind(
        roomId,
        guestId,
        await digest(guestToken),
        guest.name,
        NOW,
        guest.id,
      ),
  ]);
  return {
    roomId,
    hostId,
    guestId,
    hostToken,
    guestToken,
    command: (revision: number, now = NOW) => ({
      roomId,
      memberId: hostId,
      tokenHash: hash,
      revision,
      now,
    }),
  };
}
async function fixture(expiry = NOW + 86400000) {
  const host = await profile("1", "Host"),
    guest = await profile("2", "Guest");
  return { host, guest, room: await room(host, guest, expiry) };
}
async function ready(r: Awaited<ReturnType<typeof room>>) {
  await setMemberReady(db, r.roomId, r.hostId, true, NOW);
  await setMemberReady(db, r.roomId, r.guestId, true, NOW);
}
beforeEach(async () => {
  sequence = 0;
  db = await openTestDatabase();
});
afterEach(() => db.close());
describe("private stable profiles", () => {
  it("recovers identity without resetting data or exposing secrets", async () => {
    const p = await profile("1", "Host");
    await report(p, 40, ["porch-lanterns"]);
    const r = await api("/api/profile/create", p.token, {
      name: "Old payload",
    });
    expect(r.status).toBe(200);
    const data = (await r.json()).profile;
    expect(data).toMatchObject({
      id: p.id,
      name: "Host",
      totalMinutes: 40,
      upgrades: ["porch-lanterns"],
    });
    expect(data).not.toHaveProperty("secret_hash");
  });
  it("rejects stale reports, wrong secrets, invalid catalogues and foreign origins", async () => {
    const p = await profile("1", "Host"),
      payload = {
        name: "Host",
        totalMinutes: 999,
        streak: 3,
        upgrades: [],
        revision: 0,
      };
    await report(p, 80);
    expect((await api("/api/profile/report", p.token, payload)).status).toBe(
      409,
    );
    expect((await report(p, 20)).totalMinutes).toBe(80);
    expect(
      (
        await api("/api/profile/report", "f".repeat(64), {
          ...payload,
          profileId: p.id,
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await api("/api/profile/report", p.token, {
          ...payload,
          revision: p.revision,
          upgrades: ["festival", "festival"],
        })
      ).status,
    ).toBe(400);
    const request = req("/api/profile/report", p.token, payload);
    request.headers.set("Origin", "https://other.test");
    expect((await handleApi(request, { DB: db }, NOW)).status).toBe(403);
  });
  it("keeps ties sticky and reverses only for a strict lead across rooms", async () => {
    const { host, guest, room: r } = await fixture();
    const social = () => roomSocial(db, r.roomId, r.hostId, NOW);
    expect((await social()).comparisons[0].leaderProfileId).toBeNull();
    await report(host, 10);
    expect((await social()).comparisons[0].leaderProfileId).toBe(host.id);
    await report(guest, 10);
    expect((await social()).comparisons[0].leaderProfileId).toBe(host.id);
    await report(guest, 11);
    expect((await social()).comparisons[0].leaderProfileId).toBe(guest.id);
    await db.prepare("DELETE FROM rooms WHERE id=?").bind(r.roomId).run();
    const next = await room(host, guest);
    expect(
      (await roomSocial(db, next.roomId, next.hostId, NOW)).comparisons[0]
        .leaderProfileId,
    ).toBe(guest.id);
  });
  it("shows the owner village and only co-present profiles", async () => {
    const { host, guest, room: r } = await fixture();
    const outside = await profile("3", "Outside");
    await report(host, 10, ["porch-lanterns"]);
    await report(guest, 20, ["festival"]);
    await report(outside, 999);
    const social = await roomSocial(db, r.roomId, r.guestId, NOW);
    expect(social.world.upgrades).toEqual(["porch-lanterns"]);
    expect(social.people.map((p) => p.id).sort()).toEqual(
      [host.id, guest.id].sort(),
    );
    await expect(roomSocial(db, r.roomId, id(), NOW)).rejects.toMatchObject({
      status: 401,
    });
  });
});
describe("durable co-op focus", () => {
  it("requires a ready roster and leaves no partial sessions", async () => {
    const { room: r } = await fixture();
    await setMemberReady(db, r.roomId, r.hostId, true, NOW);
    await expect(startSharedFocus(db, r.command(0), 1)).rejects.toMatchObject({
      status: 409,
    });
    expect(
      await db.prepare("SELECT COUNT(*) AS n FROM focus_sessions").first(),
    ).toMatchObject({ n: 0 });
  });
  it("serializes concurrent starts and completion, issues one grant per participant", async () => {
    const { host, guest, room: r } = await fixture();
    await ready(r);
    const starts = await Promise.allSettled([
      startSharedFocus(db, r.command(0), 1),
      startSharedFocus(db, r.command(0), 1),
    ]);
    expect(starts.filter((s) => s.status === "fulfilled")).toHaveLength(1);
    const sessionId = (
      starts.find(
        (s) => s.status === "fulfilled",
      ) as PromiseFulfilledResult<string>
    ).value;
    expect(
      await db
        .prepare("SELECT COUNT(*) AS n FROM session_participants")
        .first(),
    ).toMatchObject({ n: 2 });
    expect(await pendingSharedGrants(db, host.id, NOW + 59999)).toEqual([]);
    await Promise.all([
      settleSharedSession(db, sessionId, NOW + 60000),
      settleSharedSession(db, sessionId, NOW + 60000),
    ]);
    expect(await pendingSharedGrants(db, host.id, NOW + 60000)).toHaveLength(1);
    expect(await pendingSharedGrants(db, guest.id, NOW + 60000)).toHaveLength(
      1,
    );
    expect(
      await db
        .prepare("SELECT shared_minutes FROM rooms WHERE id=?")
        .bind(r.roomId)
        .first(),
    ).toMatchObject({ shared_minutes: 1 });
    await acknowledgeSharedGrants(db, host.id, [sessionId], NOW + 60001);
    await acknowledgeSharedGrants(db, host.id, [sessionId], NOW + 60002);
    expect(await pendingSharedGrants(db, host.id, NOW + 60003)).toEqual([]);
    expect(await pendingSharedGrants(db, guest.id, NOW + 60003)).toHaveLength(
      1,
    );
  });
  it("pauses deadlines and rejects stale control without altering the session", async () => {
    const { host, room: r } = await fixture();
    await ready(r);
    const sid = await startSharedFocus(db, r.command(0), 1);
    await controlSharedFocus(db, r.command(1, NOW + 20000), "pause");
    await expect(
      controlSharedFocus(db, r.command(1, NOW + 21000), "reset"),
    ).rejects.toMatchObject({ status: 409 });
    expect(
      await db
        .prepare("SELECT status,remaining_ms FROM focus_sessions WHERE id=?")
        .bind(sid)
        .first(),
    ).toMatchObject({ status: "paused", remaining_ms: 40000 });
    expect(await pendingSharedGrants(db, host.id, NOW + 120000)).toEqual([]);
    await controlSharedFocus(db, r.command(2, NOW + 120000), "resume");
    expect(await pendingSharedGrants(db, host.id, NOW + 159999)).toEqual([]);
    expect(await pendingSharedGrants(db, host.id, NOW + 160000)).toHaveLength(
      1,
    );
  });
  it("late joiners and unrelated profiles cannot collect or erase another reward", async () => {
    const { host, room: r } = await fixture();
    await ready(r);
    const sid = await startSharedFocus(db, r.command(0), 1),
      late = await profile("3", "Late");
    await db
      .prepare(
        "INSERT INTO members (room_id,id,token_hash,name,last_seen,profile_id) VALUES (?,?,?,?,?,?)",
      )
      .bind(r.roomId, id(), "late-hash", late.name, NOW + 10000, late.id)
      .run();
    await settleSharedSession(db, sid, NOW + 60000);
    await acknowledgeSharedGrants(db, late.id, [sid], NOW + 60001);
    expect(await pendingSharedGrants(db, late.id, NOW + 60002)).toEqual([]);
    expect(await pendingSharedGrants(db, host.id, NOW + 60002)).toHaveLength(1);
  });
  it("explicit departure forfeits an unfinished session while a disconnected host still earns it", async () => {
    const { host, guest, room: r } = await fixture();
    await ready(r);
    await startSharedFocus(db, r.command(0), 1);
    expect(
      (
        await api(
          "/api/rooms/" + r.roomId + "/leave",
          r.guestToken,
          {},
          NOW + 10000,
        )
      ).status,
    ).toBe(200);
    expect(await pendingSharedGrants(db, guest.id, NOW + 60000)).toEqual([]);
    expect(await pendingSharedGrants(db, host.id, NOW + 60000)).toHaveLength(1);
  });
  it("room expiry preserves earned receipts; reset cancels unearned focus", async () => {
    const { host, room: r } = await fixture(NOW + 60000);
    await ready(r);
    const sid = await startSharedFocus(db, r.command(0), 1);
    await db
      .prepare("DELETE FROM rooms WHERE expires_at<=?")
      .bind(NOW + 60000)
      .run();
    expect(
      await db
        .prepare("SELECT room_id FROM focus_sessions WHERE id=?")
        .bind(sid)
        .first(),
    ).toMatchObject({ room_id: null });
    expect(await pendingSharedGrants(db, host.id, NOW + 60001)).toHaveLength(1);
  });
  it("a cancelled session never grants rewards", async () => {
    const { host, room: r } = await fixture();
    await ready(r);
    await startSharedFocus(db, r.command(0), 1);
    await controlSharedFocus(db, r.command(1, NOW + 10000), "reset");
    expect(await pendingSharedGrants(db, host.id, NOW + 120000)).toEqual([]);
  });
});
