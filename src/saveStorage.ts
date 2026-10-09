import {
  SAVE_KEY,
  parseSave,
  serializeSave,
  type SaveData,
} from "./game/state";
export const RECOVERY_KEY = "focus-town-recovery-v1";
type Store = Pick<Storage, "getItem" | "setItem">;
export function readStoredSave(store: Store) {
  const raw = store.getItem(SAVE_KEY);
  const parsed = parseSave(raw);
  let recovery: SaveData | null = null;
  if (parsed.error || raw === null) {
    try {
      const copy = store.getItem(RECOVERY_KEY);
      const checked = parseSave(copy);
      if (copy !== null && !checked.error) recovery = checked.save;
    } catch {
      /* The primary save remains authoritative. */
    }
  }
  return {
    ...parsed,
    recovery,
    error:
      parsed.error ??
      (recovery
        ? "The main save is missing. Open Settings to review the recovery copy before continuing."
        : null),
  };
}
export function writeStoredSave(store: Store, next: SaveData) {
  const raw = serializeSave(next);
  if (parseSave(raw).error) return { saved: false, mirrored: false };
  try {
    store.setItem(SAVE_KEY, raw);
  } catch {
    return { saved: false, mirrored: false };
  }
  try {
    store.setItem(RECOVERY_KEY, raw);
    return { saved: true, mirrored: true };
  } catch {
    return { saved: true, mirrored: false };
  }
}
