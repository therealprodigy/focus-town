import { beforeEach, afterEach, expect, it, vi } from "vitest";
const key = "focus-town-profile-v1";
const secret = "a".repeat(64);
const report = { totalMinutes: 25, streak: 1, upgrades: [] };
const profile = { id: "b".repeat(32), name: "Reader", revision: 0, ...report };
let storage: Map<string, string>;
beforeEach(() => {
  vi.resetModules();
  storage = new Map([[key, JSON.stringify({ secret, name: "Reader" })]]);
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
  });
});
afterEach(() => vi.unstubAllGlobals());
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
it("does not contact profile endpoints from a read-only tab", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const { syncProfile, prepareProfile } = await import("../src/profileClient");
  expect(
    await syncProfile(
      () => report,
      () => true,
      () => false,
    ),
  ).toBeNull();
  await expect(prepareProfile("Other", report, () => false)).rejects.toThrow(
    "owns this save",
  );
  expect(fetcher).not.toHaveBeenCalled();
  expect(JSON.parse(storage.get(key)!).name).toBe("Reader");
});
it("does not retry a stale report after losing save ownership", async () => {
  let writable = true;
  const paths: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      paths.push(url);
      if (url.endsWith("create")) return response({ profile });
      writable = false;
      return response({ profile: { ...profile, revision: 1 } }, 409);
    }),
  );
  const { prepareProfile } = await import("../src/profileClient");
  await expect(
    prepareProfile("Reader", report, () => writable),
  ).rejects.toThrow("owns the save");
  expect(paths).toEqual(["/api/profile/create", "/api/profile/report"]);
});
it("keeps unpersisted grants pending without acknowledging them", async () => {
  const paths: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      paths.push(url);
      return response({
        grants: [
          {
            id: "c".repeat(32),
            minutes: 25,
            completedAt: 1000,
            rewards: { coins: 12, energy: 25, xp: 25 },
          },
        ],
      });
    }),
  );
  const { syncProfile } = await import("../src/profileClient");
  await expect(
    syncProfile(
      () => report,
      () => false,
      () => true,
    ),
  ).rejects.toThrow("Shared rewards are waiting");
  expect(paths).toEqual(["/api/profile/grants"]);
});
it("acknowledges only after persistence and skips reporting if ownership moves", async () => {
  let writable = true;
  const paths: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      paths.push(url);
      return response(
        url.endsWith("grants")
          ? { grants: [{ id: "d".repeat(32) }] }
          : { ok: true },
      );
    }),
  );
  const { syncProfile } = await import("../src/profileClient");
  await syncProfile(
    () => report,
    () => {
      writable = false;
      return true;
    },
    () => writable,
  );
  expect(paths).toEqual(["/api/profile/grants", "/api/profile/grants/ack"]);
});
