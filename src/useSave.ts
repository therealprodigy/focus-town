import { useCallback, useEffect, useRef, useState } from "react";
import {
  SAVE_KEY,
  createSave,
  parseSave,
  serializeSave,
  type SaveData,
} from "./game/state";
export function useSave() {
  const [save, setSave] = useState<SaveData>(createSave),
    ref = useRef(save);
  const lock = useRef(false),
    valid = useRef(false);
  const [ready, setReady] = useState(false),
    [notice, setNotice] = useState("Opening save...");
  const persist = useCallback((next: SaveData) => {
    try {
      localStorage.setItem(SAVE_KEY, serializeSave(next));
      ref.current = next;
      valid.current = true;
      setSave(next);
      setNotice("");
      return true;
    } catch {
      setNotice("Could not save. Free some browser storage and try again.");
      return false;
    }
  }, []);
  const update = useCallback(
    (change: (s: SaveData) => SaveData) => {
      if (!lock.current || !valid.current) return false;
      const next = change(ref.current);
      return next === ref.current || persist(next);
    },
    [persist],
  );
  const restore = useCallback(
    (next: SaveData) => {
      if (!lock.current || parseSave(serializeSave(next)).error) return false;
      return persist(next);
    },
    [persist],
  );
  const exportRaw = () => {
    try {
      return localStorage.getItem(SAVE_KEY) ?? serializeSave(ref.current);
    } catch {
      return serializeSave(ref.current);
    }
  };
  useEffect(() => {
    let alive = true,
      release: (() => void) | undefined;
    const controller = new AbortController();
    const load = () => {
      try {
        const parsed = parseSave(localStorage.getItem(SAVE_KEY));
        ref.current = parsed.save;
        valid.current = !parsed.error;
        setSave(parsed.save);
        setNotice(parsed.error ?? "");
      } catch {
        valid.current = false;
        setNotice("Browser storage is unavailable. Sessions cannot be saved.");
      }
    };
    if (!navigator.locks) {
      load();
      setNotice(
        "This browser cannot protect saves across tabs. Use a current browser for sessions.",
      );
      setReady(true);
      return () => {
        alive = false;
      };
    }
    load();
    setNotice(
      "Save open in another tab. Close that tab to start sessions here.",
    );
    setReady(true);
    void navigator.locks
      .request(
        "focusraid-save-writer",
        { signal: controller.signal },
        async () => {
          if (!alive) return;
          lock.current = true;
          load();
          setReady(true);
          await new Promise<void>((resolve) => {
            release = resolve;
          });
          lock.current = false;
        },
      )
      .catch(() => {
        if (alive && !controller.signal.aborted) {
          setNotice("Could not open the save. Reload to try again.");
          setReady(true);
        }
      });
    return () => {
      alive = false;
      lock.current = false;
      controller.abort();
      release?.();
    };
  }, []);
  return {
    save,
    update,
    restore,
    exportRaw,
    ready,
    notice,
    canSave: lock.current && valid.current,
    canRestore: lock.current,
  };
}
