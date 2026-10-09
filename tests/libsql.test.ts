import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createClient, type Client } from "@libsql/client";
import { libsqlDatabase } from "../server/libsql";
import { applyMigrations, readMigrations } from "../scripts/migrate-libsql";
import { createVercelHandler, vercelRequest } from "../server/vercel-handler";
let client: Client;
let db: ReturnType<typeof libsqlDatabase>;
beforeEach(async () => {
  client = createClient({ url: ":memory:", intMode: "number" });
  await client.execute("PRAGMA foreign_keys=ON");
  db = libsqlDatabase(client);
});
afterEach(() => client.close());
describe("libSQL compatibility", () => {
  it("keeps bindings independent and maps RETURNING and CAS changes", async () => {
    await db
      .prepare("CREATE TABLE counters(id TEXT PRIMARY KEY,n INTEGER)")
      .run();
    const insert = db.prepare("INSERT INTO counters VALUES (?,?)");
    await insert.bind("a", 1).run();
    await insert.bind("b", 2).run();
    expect(
      await db
        .prepare("UPDATE counters SET n=n+1 WHERE id=? RETURNING n")
        .bind("a")
        .first(),
    ).toEqual({ n: 2 });
    expect(
      (
        await db
          .prepare("UPDATE counters SET n=3 WHERE id=? AND n=1")
          .bind("a")
          .run()
      ).meta.changes,
    ).toBe(0);
    expect(
      (
        await db
          .prepare("UPDATE counters SET n=3 WHERE id=? AND n=2")
          .bind("a")
          .run()
      ).meta.changes,
    ).toBe(1);
  });
  it("rolls back the entire batch after a later failure", async () => {
    await db.prepare("CREATE TABLE items(id TEXT PRIMARY KEY)").run();
    await expect(
      db.batch([
        db.prepare("INSERT INTO items VALUES (?)").bind("same"),
        db.prepare("INSERT INTO items VALUES (?)").bind("same"),
      ]),
    ).rejects.toThrow();
    expect(await db.prepare("SELECT COUNT(*) AS n FROM items").first()).toEqual(
      { n: 0 },
    );
  });
  it("applies current migrations and retries without repeating them", async () => {
    const migrations = await readMigrations();
    await applyMigrations(client, migrations);
    await applyMigrations(client, migrations);
    expect(
      await db.prepare("SELECT COUNT(*) AS n FROM focus_migrations").first(),
    ).toEqual({ n: migrations.length });
    expect(
      (await db.prepare("PRAGMA table_info(rooms)").all()).results.some(
        (row) => row.name === "active_session_id",
      ),
    ).toBe(true);
    expect(
      await db.prepare("SELECT COUNT(*) AS n FROM reward_grants").first(),
    ).toEqual({ n: 0 });
  });
  it("rejects changed applied migrations", async () => {
    const migration = {
      name: "0000_test.sql",
      sql: "CREATE TABLE sample(id TEXT)",
    };
    await applyMigrations(client, [migration]);
    await expect(
      applyMigrations(client, [{ ...migration, sql: migration.sql + "; " }]),
    ).rejects.toThrow("changed");
  });
  it("rolls back failed migration DDL and its receipt", async () => {
    await expect(
      applyMigrations(client, [
        {
          name: "0000_bad.sql",
          sql: "CREATE TABLE transient(id TEXT);--> statement-breakpoint INVALID SQL",
        },
      ]),
    ).rejects.toThrow();
    expect(
      await db
        .prepare(
          "SELECT COUNT(*) AS n FROM sqlite_master WHERE name='transient'",
        )
        .first(),
    ).toEqual({ n: 0 });
    expect(
      await db.prepare("SELECT COUNT(*) AS n FROM focus_migrations").first(),
    ).toEqual({ n: 0 });
  });
  it("cascades membership deletion but preserves earned session records", async () => {
    await applyMigrations(client, await readMigrations());
    await db
      .prepare(
        "INSERT INTO rooms(id,invite_hash,host_member_id,expires_at) VALUES ('r','h','m',999999)",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO members(room_id,id,token_hash,name,last_seen) VALUES ('r','m','t','Player',1)",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO focus_sessions(id,room_id,minutes,started_at,due_at,remaining_ms,status) VALUES ('s','r',1,1,60001,60000,'running')",
      )
      .run();
    await db.prepare("DELETE FROM rooms WHERE id='r'").run();
    expect(
      await db.prepare("SELECT COUNT(*) AS n FROM members").first(),
    ).toEqual({ n: 0 });
    expect(
      await db
        .prepare("SELECT room_id FROM focus_sessions WHERE id='s'")
        .first(),
    ).toEqual({ room_id: null });
  });
});
describe("Vercel request boundary", () => {
  it("replaces spoofed Cloudflare identity without changing request data", async () => {
    const source = new Request("https://town.test/api/profile/create", {
      method: "POST",
      headers: {
        Origin: "https://town.test",
        "Content-Type": "application/json",
        "CF-Connecting-IP": "attacker",
        "x-vercel-forwarded-for": "192.0.2.1",
      },
      body: '{"name":"Player"}',
    });
    const request = vercelRequest(source);
    expect(request.url).toBe(source.url);
    expect(request.headers.get("Origin")).toBe("https://town.test");
    expect(request.headers.get("CF-Connecting-IP")).toBe("192.0.2.1");
    expect(await request.text()).toBe('{"name":"Player"}');
  });
  it("discards spoofed identity when trusted metadata is missing", () => {
    const request = vercelRequest(
      new Request("https://town.test/api/rooms", {
        headers: { "CF-Connecting-IP": "attacker" },
      }),
    );
    expect(request.headers.get("CF-Connecting-IP")).toBe("vercel-unknown");
  });
  it("retains same-origin rejection and bodyless HEAD", async () => {
    const handle = createVercelHandler(async () => db);
    const rejected = await handle(
      new Request("https://town.test/api/rooms", {
        method: "POST",
        headers: {
          Origin: "https://other.test",
          "Content-Type": "application/json",
        },
        body: "{}",
      }),
    );
    expect(rejected.status).toBe(403);
    const head = await handle(
      new Request("https://town.test/api/rooms", { method: "HEAD" }),
    );
    expect(head.status).toBe(405);
    expect(head.body).toBeNull();
  });
  it("creates a profile through the real API and libSQL adapter", async () => {
    await applyMigrations(client, await readMigrations());
    const handle = createVercelHandler(async () => db);
    const response = await handle(
      new Request("https://town.test/api/profile/create", {
        method: "POST",
        headers: {
          Origin: "https://town.test",
          "Content-Type": "application/json",
          Authorization: "Bearer " + "a".repeat(64),
          "x-vercel-forwarded-for": "192.0.2.1",
        },
        body: '{"name":"Player"}',
      }),
    );
    expect(response.status).toBe(201);
    expect((await response.json()).profile.name).toBe("Player");
  });
});
