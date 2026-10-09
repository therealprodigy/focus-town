import type { UpgradeId } from "./game/townCatalog";
import type { SharedGrant } from "./game/townProgress";
export type Report = {
  totalMinutes: number;
  streak: number;
  upgrades: UpgradeId[];
};
export type DeviceProfile = Report & {
  id: string;
  name: string;
  revision: number;
};
export type SocialSnapshot = {
  world: {
    ownerProfileId: string | null;
    upgrades: UpgradeId[];
    revision: number;
  };
  people: { id: string; name: string; totalMinutes: number; streak: number }[];
  comparisons: {
    lowProfileId: string;
    highProfileId: string;
    leaderProfileId: string | null;
  }[];
};
const KEY = "focus-town-profile-v1";
let current: DeviceProfile | null = null,
  lastReport = "",
  jobs: Promise<unknown> = Promise.resolve();
export function profileCredential(): { secret: string; name: string } | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null");
    return p && /^[a-f0-9]{64}$/.test(p.secret) && typeof p.name === "string"
      ? p
      : null;
  } catch {
    return null;
  }
}
async function request(path: string, body: unknown, secret: string) {
  const res = await fetch("/api/profile/" + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + secret,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(9000),
  });
  const data = await res
    .json()
    .catch(() => ({ error: "Your profile could not connect." }));
  return { ok: res.ok, status: res.status, data };
}
function queue<T>(job: () => Promise<T>): Promise<T> {
  const next = jobs.then(job, job);
  jobs = next.catch(() => {});
  return next;
}
export function prepareProfile(
  name: string,
  report: Report,
  canReport: () => boolean,
) {
  return queue(async () => {
    if (!canReport())
      throw new Error("Open the tab that owns this save to join a room.");
    let c = profileCredential();
    if (!c)
      c = {
        secret: Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
          n.toString(16).padStart(2, "0"),
        ).join(""),
        name,
      };
    else c = { ...c, name };
    localStorage.setItem(KEY, JSON.stringify(c));
    const response = await request("create", { name }, c.secret);
    if (!response.ok) throw new Error(response.data.error);
    current = response.data.profile;
    if (!canReport())
      throw new Error("This tab no longer owns the save. Open its other tab.");
    await sendReport(c, report, canReport);
    if (!canReport())
      throw new Error("This tab no longer owns the save. Open its other tab.");
    return { secret: c.secret, profile: current! };
  });
}
async function sendReport(
  c: { secret: string; name: string },
  report: Report,
  canReport: () => boolean,
) {
  const fingerprint = JSON.stringify({ ...report, name: c.name });
  if (fingerprint === lastReport && current) return;
  if (!current) {
    const r = await request("create", { name: c.name }, c.secret);
    if (!r.ok) throw new Error(r.data.error);
    current = r.data.profile;
  }
  for (let i = 0; i < 2; i++) {
    if (!canReport()) return;
    const r = await request(
      "report",
      { ...report, name: c.name, revision: current!.revision },
      c.secret,
    );
    if (r.data.profile) current = r.data.profile;
    if (r.ok) {
      lastReport = fingerprint;
      return;
    }
    if (r.status !== 409 || i === 1) throw new Error(r.data.error);
  }
}
export function syncProfile(
  report: () => Report,
  receive: (grants: SharedGrant[]) => boolean,
  canReport: () => boolean,
) {
  return queue(async () => {
    if (!canReport()) return current;
    const c = profileCredential();
    if (!c) return null;
    for (let page = 0; page < 4; page++) {
      const r = await request("grants", {}, c.secret);
      if (!r.ok) throw new Error(r.data.error);
      const grants = r.data.grants as SharedGrant[];
      if (!Array.isArray(grants))
        throw new Error("Could not read shared rewards.");
      if (!grants.length) break;
      if (!receive(grants))
        throw new Error(
          "Shared rewards are waiting. Open the tab that owns this save to collect them.",
        );
      const ack = await request(
        "grants/ack",
        { ids: grants.map((g) => g.id) },
        c.secret,
      );
      if (!ack.ok) throw new Error(ack.data.error);
      if (grants.length < 32) break;
    }
    if (!canReport()) return current;
    await sendReport(c, report(), canReport);
    return current;
  });
}
