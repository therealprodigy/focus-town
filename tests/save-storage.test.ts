import { expect, it } from "vitest";
import {
  createSave,
  SAVE_KEY,
  serializeSave,
  parseSave,
  characterNameFrom,
} from "../src/game/state";
import { applySharedGrant } from "../src/game/townProgress";
import {
  readStoredSave,
  writeStoredSave,
  RECOVERY_KEY,
} from "../src/saveStorage";
const grant = {
  id: "a".repeat(32),
  minutes: 25,
  completedAt: 1000,
  rewards: { coins: 12, energy: 25, xp: 25 },
};
function store(entries: [string, string][] = [], fail?: string) {
  const data = new Map(entries);
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem(key: string, value: string) {
      if (key === fail) throw new Error("quota");
      data.set(key, value);
    },
  };
}
it("keeps committed copies intact when the primary write fails", () => {
  const raw = serializeSave(createSave());
  const s = store(
    [
      [SAVE_KEY, raw],
      [RECOVERY_KEY, raw],
    ],
    SAVE_KEY,
  );
  expect(writeStoredSave(s, applySharedGrant(createSave(), grant))).toEqual({
    saved: false,
    mirrored: false,
  });
  expect([...s.data.values()]).toEqual([raw, raw]);
});
it("commits primary progress even if its recovery mirror fails", () => {
  const old = serializeSave(createSave());
  const next = applySharedGrant(createSave(), grant);
  const s = store(
    [
      [SAVE_KEY, old],
      [RECOVERY_KEY, old],
    ],
    RECOVERY_KEY,
  );
  expect(writeStoredSave(s, next)).toEqual({ saved: true, mirrored: false });
  expect(s.getItem(SAVE_KEY)).toBe(serializeSave(next));
  expect(s.getItem(RECOVERY_KEY)).toBe(old);
  expect(readStoredSave(s).save).toEqual(next);
});
it("offers recovery without replacing damaged primary data", () => {
  const next = applySharedGrant(createSave(), grant);
  const s = store([
    [SAVE_KEY, "{broken"],
    [RECOVERY_KEY, serializeSave(next)],
  ]);
  const found = readStoredSave(s);
  expect(found.error).toBeTruthy();
  expect(found.recovery).toEqual(next);
  expect(s.getItem(SAVE_KEY)).toBe("{broken");
});
it("requires recovery review when the primary is missing", () => {
  const next = applySharedGrant(createSave(), grant);
  const s = store([[RECOVERY_KEY, serializeSave(next)]]);
  expect(readStoredSave(s).error).toBeTruthy();
  expect(readStoredSave(s).recovery).toEqual(next);
  expect(s.getItem(SAVE_KEY)).toBeNull();
  expect(readStoredSave(store()).error).toBeNull();
});
it("rejects invalid recovery and invalid writes without replacing data", () => {
  const s = store([
    [SAVE_KEY, "{broken"],
    [RECOVERY_KEY, "{broken"],
  ]);
  expect(readStoredSave(s).recovery).toBeNull();
  expect(writeStoredSave(s, { ...createSave(), coins: -1 }).saved).toBe(false);
  expect(s.getItem(SAVE_KEY)).toBe("{broken");
});
it("keeps grant receipts so recovery does not duplicate rewards", () => {
  const next = applySharedGrant(createSave(), grant);
  const s = store();
  expect(writeStoredSave(s, next)).toEqual({ saved: true, mirrored: true });
  s.data.set(SAVE_KEY, "{broken");
  const recovered = readStoredSave(s).recovery!;
  expect(recovered).toEqual(next);
  expect(applySharedGrant(recovered, grant)).toBe(recovered);
});
it("opens legacy saves and carries a chosen name through a backup", () => {
  expect(parseSave(serializeSave(createSave())).error).toBeNull();
  const named = { ...createSave(), characterName: "Rowan II" };
  expect(parseSave(serializeSave(named)).save).toEqual(named);
  expect(characterNameFrom("  Rowan II  ")).toBe("Rowan II");
});
it("rejects blank, oversized and control-character names", () => {
  for (const name of ["", " ", "x".repeat(25), "one\ntwo", "one\ttwo"]) {
    expect(characterNameFrom(name)).toBeNull();
    expect(
      parseSave(serializeSave({ ...createSave(), characterName: name })).error,
    ).toBeTruthy();
  }
});
