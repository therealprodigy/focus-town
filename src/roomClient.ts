import {
  prepareProfile,
  syncProfile,
  profileCredential,
  type Report,
  type DeviceProfile,
  type SocialSnapshot,
} from "./profileClient";
import type { SharedGrant } from "./game/townProgress";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Appearance } from "./game/personalization";
export type Presence = {
  appearance?: Appearance;
  scene: "village" | "house";
  x: number;
  y: number;
  facing: "up" | "down" | "left" | "right";
  updatedAt?: number;
};
export type RoomTimer = {
  kind: "focus" | "short" | "long";
  status: "running" | "paused" | "complete";
  minutes: number;
  endAt: number | null;
  remainingMs: number;
};
export type RoomSnapshot = {
  social: SocialSnapshot;
  id: string;
  revision: number;
  hostId: string;
  serverNow: number;
  expiresAt: number;
  sharedMinutes: number;
  timer: RoomTimer | null;
  members: {
    profileId: string | null;
    ready: boolean;
    id: string;
    name: string;
    online: boolean;
    position: Presence | null;
    positionSeq: number;
  }[];
};
type Credentials = {
  roomId: string;
  memberId: string;
  token: string;
  invite?: string;
};
const KEY = "focus-town-room-v1";
class RoomError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
function read(): Credentials | null {
  try {
    const c = JSON.parse(sessionStorage.getItem(KEY) || "null");
    return c &&
      /^[a-f0-9]{32}$/.test(c.roomId) &&
      /^[a-f0-9]{32}$/.test(c.memberId) &&
      /^[a-f0-9]{64}$/.test(c.token)
      ? c
      : null;
  } catch {
    return null;
  }
}
export function roomRemaining(
  s: RoomSnapshot,
  received: number,
  monotonic = performance.now(),
) {
  const t = s.timer;
  if (!t) return 0;
  return t.status === "running"
    ? Math.max(
        0,
        Math.min(
          t.remainingMs,
          (t.endAt ?? s.serverNow) - s.serverNow - (monotonic - received),
        ),
      )
    : t.status === "complete"
      ? 0
      : t.remainingMs;
}
export function useRoom() {
  const canReport = useRef(false);
  const stats = useRef<Report>({ totalMinutes: 0, streak: 0, upgrades: [] });
  const receiveGrants = useRef<(grants: SharedGrant[]) => boolean>(() => false);
  const [profile, setProfile] = useState<DeviceProfile | null>(null),
    [profileError, setProfileError] = useState("");
  useEffect(() => {
    let stopped = false,
      running = false;
    const sync = async () => {
      if (running || !canReport.current || !profileCredential()) return;
      running = true;
      try {
        const p = await syncProfile(
          () => stats.current,
          (g) => receiveGrants.current(g),
          () => canReport.current,
        );
        if (!stopped) {
          setProfile(p);
          setProfileError("");
        }
      } catch (e) {
        if (!stopped)
          setProfileError(
            e instanceof Error ? e.message : "Profile sync is waiting.",
          );
      } finally {
        running = false;
      }
    };
    void sync();
    const timer = setInterval(() => void sync(), 15000);
    const wake = () => {
      if (!document.hidden) void sync();
    };
    document.addEventListener("visibilitychange", wake);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);

  const [credentials, setCredentials] = useState<Credentials | null>(read),
    cref = useRef(credentials);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [connected, setConnected] = useState(false);
  const position = useRef<(() => Presence | undefined) | null>(null),
    townVisible = useRef(false),
    positionSeq = useRef(0);
  const busyRef = useRef(false),
    received = useRef(0),
    generation = useRef(0),
    sref = useRef<RoomSnapshot | null>(null);
  const saveCredentials = useCallback((c: Credentials | null) => {
    cref.current = c;
    setCredentials(c);
    try {
      if (c) sessionStorage.setItem(KEY, JSON.stringify(c));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* Membership still works until this tab closes. */
    }
  }, []);
  const clear = useCallback(() => {
    generation.current++;
    saveCredentials(null);
    setSnapshot(null);
    sref.current = null;
    setConnected(false);
  }, [saveCredentials]);
  const accept = useCallback((s: RoomSnapshot) => {
    const own = s.members.find((m) => m.id === cref.current?.memberId);
    positionSeq.current = Math.max(positionSeq.current, own?.positionSeq ?? 0);
    if (
      !sref.current ||
      s.id !== sref.current.id ||
      s.revision > sref.current.revision ||
      (s.revision === sref.current.revision &&
        s.serverNow >= sref.current.serverNow)
    ) {
      sref.current = s;
      received.current = performance.now();
      setSnapshot(s);
    }
    setConnected(true);
    setError("");
  }, []);
  const request = useCallback(
    async (
      path: string,
      body: unknown,
      token?: string,
      profileSecret?: string,
    ) => {
      const res = await fetch("/api/rooms" + path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(profileSecret ? { "X-Focus-Profile": profileSecret } : {}),
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(9000),
      });
      const data = await res.json().catch(() => ({
        error: "Co-op could not connect. Solo focus still works here.",
      }));
      if (!res.ok)
        throw new RoomError(
          data.error || "The room could not be reached.",
          res.status,
        );
      return data;
    },
    [],
  );
  const failed = useCallback(
    (e: unknown) => {
      if (e instanceof RoomError && (e.status === 401 || e.status === 404))
        clear();
      setError(
        e instanceof Error ? e.message : "The room could not be reached.",
      );
      setConnected(false);
    },
    [clear],
  );
  useEffect(() => {
    if (!credentials) return;
    const gen = ++generation.current;
    let stopped = false,
      polling = false,
      timeout: number;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        const data = await request(
          "/" + credentials.roomId + "/sync",
          {
            position: position.current?.(),
            positionSeq: ++positionSeq.current,
          },
          credentials.token,
        );
        if (!stopped && gen === generation.current) accept(data.snapshot);
      } catch (e) {
        if (!stopped && gen === generation.current) failed(e);
      } finally {
        polling = false;
        if (!stopped && gen === generation.current)
          timeout = window.setTimeout(
            poll,
            document.hidden ? 12000 : townVisible.current ? 1000 : 4000,
          );
      }
    };
    void poll();
    const wake = () => {
      if (!document.hidden) {
        clearTimeout(timeout);
        void poll();
      }
    };
    document.addEventListener("visibilitychange", wake);
    return () => {
      stopped = true;
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [credentials, request, accept, failed]);
  const enter = async (name: string, invite?: string) => {
    if (busyRef.current || cref.current || !canReport.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const device = await prepareProfile(
        name,
        stats.current,
        () => canReport.current,
      );
      setProfile(device.profile);
      const data = await request(
        invite ? "/join" : "",
        { name, invite },
        undefined,
        device.secret,
      );
      generation.current++;
      sref.current = null;
      saveCredentials(data.credentials);
      accept(data.snapshot);
      if (location.hash.startsWith("#room="))
        history.replaceState(null, "", location.pathname);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the room.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const control = async (action: string, kind?: string, minutes?: number) => {
    const c = cref.current,
      s = sref.current;
    if (!c || !s || busyRef.current || !connected) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const data = await request(
        "/" + c.roomId + "/control",
        { action, kind, minutes, revision: s.revision },
        c.token,
      );
      if (cref.current?.roomId === c.roomId) accept(data.snapshot);
    } catch (e) {
      failed(e);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const leave = async () => {
    const c = cref.current;
    if (!c || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await request("/" + c.roomId + "/leave", {}, c.token);
      clear();
      setError("");
    } catch (e) {
      failed(e);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const setReady = async (ready: boolean) => {
    const c = cref.current;
    if (!c || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const data = await request("/" + c.roomId + "/ready", { ready }, c.token);
      if (cref.current?.roomId === c.roomId) accept(data.snapshot);
    } catch (e) {
      failed(e);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  return {
    canReport,
    stats,
    receiveGrants,
    profile,
    profileError,
    setReady,
    position,
    townVisible,
    credentials,
    snapshot,
    error,
    busy,
    connected,
    received: received.current,
    enter,
    control,
    leave,
    isHost: !!credentials && snapshot?.hostId === credentials.memberId,
  };
}
