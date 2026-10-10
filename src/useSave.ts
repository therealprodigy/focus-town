import { useCallback, useEffect, useRef, useState } from "react";
import {
  SAVE_KEY,
  createSave,
  parseSave,
  serializeSave,
  type SaveData,
} from "./game/state";
import { readStoredSave, writeStoredSave } from "./saveStorage";
import {
  createSaveWriter,
  WRITER_MESSAGES,
  type WriterState,
  type WriterChannel,
} from "./saveWriter";
export function useSave() {
  const [save, setSave] = useState<SaveData>(createSave),
    ref = useRef(save);
  const lock = useRef(false),
    valid = useRef(false);
  const [ready, setReady] = useState(false),
    [notice, setNotice] = useState("Opening save...");
  const [storageStatus, setStorageStatus] = useState("Opening save...");
  const [writerState, setWriterState] = useState<WriterState>("opening");
  const [writerDismissed, setWriterDismissed] = useState(false);
  const writer = useRef<ReturnType<typeof createSaveWriter> | null>(null);
  const requestThisTab = useCallback(() => writer.current?.claim(), []);
  const dismissWriterNotice = useCallback(() => setWriterDismissed(true), []);
  const [recovery, setRecovery] = useState<SaveData | null>(null);
  const persist = useCallback((next: SaveData) => {
    let result = { saved: false, mirrored: false };
    try {
      result = writeStoredSave(localStorage, next);
    } catch {
      /* Storage access can itself be blocked. */
    }
    if (!result.saved) {
      setStorageStatus("Last change could not be saved");
      setNotice(
        "Could not save. Your last saved progress is unchanged. Export it in Settings, free some browser storage, then retry.",
      );
      return false;
    }
    ref.current = next;
    valid.current = true;
    setSave(next);
    setRecovery(null);
    setStorageStatus(
      result.mirrored
        ? "Saved here, with a recovery copy"
        : "Progress saved; recovery copy unavailable",
    );
    setNotice(
      result.mirrored
        ? ""
        : "Progress saved, but the recovery copy could not be updated. Download a backup in Settings.",
    );
    return true;
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
  const retry = useCallback(
    () => lock.current && valid.current && persist(ref.current),
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
    let alive = true;
    const load = () => {
      try {
        const parsed = readStoredSave(localStorage);
        ref.current = parsed.save;
        valid.current = !parsed.error;
        setSave(parsed.save);
        setRecovery(parsed.recovery);
        setNotice(parsed.error ?? "");
        setStorageStatus(
          parsed.error ? "Save needs attention" : "Save opened in this browser",
        );
      } catch {
        valid.current = false;
        setStorageStatus("Browser storage unavailable");
        setNotice("Browser storage is unavailable. Sessions cannot be saved.");
      }
    };
    load();
    if (!navigator.locks) {
      setNotice(
        "This browser cannot protect saves across tabs. Use a current browser for sessions.",
      );
      setStorageStatus("Saving unavailable in this browser");
      setReady(true);
      return () => {
        alive = false;
      };
    }
    let channel: WriterChannel | null = null;
    try {
      const native = new BroadcastChannel("focus-town-save-handoff");
      const endpoint: WriterChannel = {
        onmessage: null,
        postMessage: (data) => native.postMessage(data),
        close: () => native.close(),
      };
      native.onmessage = (event) => endpoint.onmessage?.({ data: event.data });
      channel = endpoint;
    } catch {
      // Web Locks still protect the save without cross-tab messages.
    }
    const coordinator = createSaveWriter({
      id: crypto.randomUUID(),
      channel,
      request: (signal, hold) =>
        navigator.locks.request("focusraid-save-writer", { signal }, hold),
      onOwnership: (owned) => {
        lock.current = false;
        if (owned && alive) {
          load();
          lock.current = true;
        }
      },
      onState: (state) => {
        if (!alive) return;
        setWriterState(state);
        setWriterDismissed(false);
        setReady(true);
      },
    });
    writer.current = coordinator;
    setReady(true);
    return () => {
      alive = false;
      coordinator.dispose();
      if (writer.current === coordinator) writer.current = null;
    };
  }, []);
  return {
    save,
    update,
    restore,
    exportRaw,
    ready,
    notice,
    recovery,
    storageStatus:
      writerState === "owned" || writerState === "opening"
        ? storageStatus
        : WRITER_MESSAGES[writerState],
    writerNotice: writerDismissed ? "" : WRITER_MESSAGES[writerState],
    canRequestThisTab: [
      "waiting",
      "yielded",
      "stalled",
      "unavailable",
    ].includes(writerState),
    requestThisTab,
    dismissWriterNotice,
    retry,
    canSave: lock.current && valid.current,
    canRestore: lock.current,
  };
}
