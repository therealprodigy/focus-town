import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { GameEngine } from "./game/engine";
import { getWorldClock } from "./game/renderer";
import { type Interaction, type SceneId } from "./game/world";
import { CHAPTERS, getChapter } from "./game/story";
import {
  parseSave,
  settleTimer,
  startFocus,
  startBreak,
  pauseTimer,
  resumeTimer,
  cancelTimer,
  dismissCompletion,
  remainingMs,
  getProgress,
  parseMinutes,
  beginCycle,
  nextCycleFocus,
  cycleBreak,
  skipCycleBreak,
  type SaveData,
} from "./game/state";
import { useSave } from "./useSave";
import { useRoom, roomRemaining } from "./roomClient";
import { Button } from "./components/ui/button";
import { LegalPage } from "./LegalPage";

type Panel =
  | "sessions"
  | "journal"
  | "story"
  | "settings"
  | "coop"
  | "cancel"
  | "import"
  | Interaction
  | null;
type Phase = "focus" | "short" | "long";
const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return (
    String(Math.floor(s / 60)).padStart(2, "0") +
    ":" +
    String(s % 60).padStart(2, "0")
  );
};
const phaseLabel = (phase: Phase) =>
  phase === "focus"
    ? "Focus"
    : phase === "short"
      ? "Short break"
      : "Long break";
function loadPrefs() {
  const defaults = {
    focus: "25",
    short: "5",
    long: "15",
    rounds: "4",
    autoBreak: false,
    cycle: true,
    task: "",
    controls: true,
    quiet: matchMedia("(prefers-reduced-motion: reduce)").matches,
    hour24: false,
  };
  try {
    const p = JSON.parse(
      localStorage.getItem("focus-town-preferences-v2") || "null",
    );
    if (!p) return defaults;
    return {
      ...defaults,
      focus: parseMinutes(p.focus) ? String(p.focus) : "25",
      short: parseMinutes(p.short) ? String(p.short) : "5",
      long: parseMinutes(p.long) ? String(p.long) : "15",
      rounds:
        Number(p.rounds) >= 1 && Number(p.rounds) <= 12
          ? String(p.rounds)
          : "4",
      autoBreak: p.autoBreak === true,
      cycle: p.cycle !== false,
      task: typeof p.task === "string" ? p.task.slice(0, 120) : "",
      controls: p.controls !== false,
      quiet: p.quiet === true,
      hour24: p.hour24 === true,
    };
  } catch {
    return defaults;
  }
}
function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    focus: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    town: (
      <>
        <path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7" />
      </>
    ),
    journal: (
      <>
        <path d="M4 4h6l2 2 2-2h6v16h-6l-2 1-2-1H4zM12 6v15" />
      </>
    ),
    settings: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M9 15v6" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-4a6 6 0 0 1 12 0v4M16 5a3 3 0 0 1 0 6M18 15a4 4 0 0 1 3 4v2" />
      </>
    ),
    expand: <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    play: <path d="m8 5 11 7-11 7z" />,
    pause: <path d="M8 5v14M16 5v14" />,
    leaf: (
      <>
        <path d="M4 20 18 6M5 17C-1 8 12 3 21 3c0 10-4 19-13 15" />
      </>
    ),
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.focus}
    </svg>
  );
}
function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "wide" : ""}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-top">
        <h2 id="dialog-title">{title}</h2>
        <Button size="icon" aria-label="Close dialog" onClick={onClose}>
          <Icon name="close" />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
export default function App() {
  return location.pathname === "/" ? <Game /> : <LegalPage />;
}
function Game() {
  const {
      save,
      update,
      restore,
      exportRaw,
      ready,
      notice,
      canSave,
      canRestore,
    } = useSave(),
    room = useRoom();
  const [prefs, setPrefs] = useState(loadPrefs),
    [view, setView] = useState<"focus" | "town">("focus"),
    [townTimerOpen, setTownTimerOpen] = useState(
      () =>
        !window.matchMedia("(max-width: 650px) and (max-height: 680px)")
          .matches,
    ),
    [panel, setPanel] = useState<Panel>(null),
    [phase, setPhase] = useState<Phase>("focus"),
    [now, setNow] = useState(Date.now),
    [message, setMessage] = useState(""),
    [fullscreen, setFullscreen] = useState(false),
    [zen, setZen] = useState(false);
  const [scene, setScene] = useState<SceneId>("village"),
    [nearby, setNearby] = useState<Interaction>(),
    [name, setName] = useState(""),
    [invite, setInvite] = useState(() =>
      location.hash.startsWith("#room=")
        ? location.hash.slice(6).slice(0, 200)
        : "",
    ),
    [backup, setBackup] = useState<SaveData | null>(null);
  const [storageNotice, setStorageNotice] = useState(() => {
    try {
      return localStorage.getItem("focus-town-storage-notice") !== "read";
    } catch {
      return true;
    }
  });
  const canvas = useRef<HTMLCanvasElement>(null),
    engine = useRef<GameEngine | null>(null),
    file = useRef<HTMLInputElement>(null);
  const progress = getProgress(save, now),
    chapter = getChapter(progress.totalMinutes),
    timer = save.timer,
    cycle = save.cycle,
    rt = room.snapshot?.timer;
  const inRoom = !!room.credentials,
    active = inRoom ? !!rt && rt.status !== "complete" : !!timer,
    focus = parseMinutes(prefs.focus),
    short = parseMinutes(prefs.short),
    long = parseMinutes(prefs.long),
    rounds = Number(prefs.rounds);
  const valid =
    !!focus &&
    !!short &&
    !!long &&
    Number.isInteger(rounds) &&
    rounds >= 1 &&
    rounds <= 12;
  const currentPhase: Phase = inRoom
    ? rt && rt.status !== "complete"
      ? rt.kind
      : phase
    : timer
      ? timer.kind === "focus"
        ? "focus"
        : (timer.breakType ??
          (cycle?.next === "break" && cycle.completed >= cycle.rounds
            ? "long"
            : "short"))
      : cycle?.next === "break"
        ? cycle.completed >= cycle.rounds
          ? "long"
          : "short"
        : cycle?.next === "focus"
          ? "focus"
          : phase;
  const planned = !inRoom && cycle && cycle.next !== "done" ? cycle : null;
  const minutes =
    currentPhase === "focus"
      ? (planned?.focus ?? focus)
      : currentPhase === "short"
        ? (planned?.short ?? short)
        : (planned?.long ?? long);
  const left = inRoom
    ? room.snapshot && rt && rt.status !== "complete"
      ? roomRemaining(room.snapshot, room.received)
      : (minutes ?? 25) * 60000
    : timer
      ? remainingMs(timer, now)
      : (minutes ?? 25) * 60000;
  const isPaused = inRoom
    ? rt?.status === "paused"
    : timer?.status === "paused";
  const close = useCallback(() => {
    setPanel(null);
    if (view === "town") requestAnimationFrame(() => engine.current?.focus());
  }, [view]);
  const setting = <K extends keyof typeof prefs>(
    key: K,
    value: (typeof prefs)[K],
  ) => setPrefs((p) => ({ ...p, [key]: value }));
  useEffect(() => {
    try {
      localStorage.setItem("focus-town-preferences-v2", JSON.stringify(prefs));
    } catch {
      /* Session progress has its own save guard. */
    }
  }, [prefs]);
  useEffect(() => {
    if (!canvas.current) return;
    const game = new GameEngine(canvas.current, {
      onInteract: (i) => {
        if (i.kind === "desk" || i.kind === "bed") {
          setPanel("sessions");
          setTownTimerOpen(true);
          setPhase(i.kind === "desk" ? "focus" : "short");
        } else setPanel(i);
      },
      onNearby: setNearby,
      onScene: setScene,
    });
    engine.current = game;
    return () => {
      game.destroy();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    const tick = () => {
      const t = Date.now();
      setNow(t);
      update((s) => settleTimer(s, t));
    };
    tick();
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [update, ready]);
  useEffect(() => {
    if (engine.current) {
      engine.current.visible = view === "town";
      engine.current.blocked = view !== "town" || !!panel;
      engine.current.streak = progress.currentStreak;
      engine.current.reducedMotion = prefs.quiet;
      engine.current.paused = isPaused === true;
    }
  }, [view, panel, progress.currentStreak, prefs.quiet, isPaused]);
  useEffect(() => {
    room.position.current = () =>
      engine.current
        ? {
            scene: engine.current.scene,
            x: engine.current.player.x,
            y: engine.current.player.y,
            facing: engine.current.player.facing,
          }
        : undefined;
    room.townVisible.current = view === "town";
    if (engine.current) {
      engine.current.setPeers(
        room.connected
          ? (room.snapshot?.members ?? [])
              .filter(
                (m) =>
                  m.id !== room.credentials?.memberId &&
                  m.online &&
                  m.position &&
                  (m.position.updatedAt ?? 0) >=
                    (room.snapshot?.serverNow ?? 0) - 30000,
              )
              .map((m) => ({ id: m.id, name: m.name, ...m.position! }))
          : [],
      );
      engine.current.sharedMinutes = inRoom
        ? (room.snapshot?.sharedMinutes ?? 0)
        : 0;
    }
  }, [view, room.snapshot, room.connected, inRoom, room.credentials?.memberId]);
  useEffect(() => {
    engine.current?.setSession(
      inRoom
        ? rt && rt.status !== "complete"
          ? rt.kind === "focus"
            ? "focus"
            : "break"
          : null
        : (timer?.kind ?? null),
      true,
    );
  }, [timer?.kind, inRoom, rt?.kind, rt?.status]);
  useEffect(() => {
    if (view !== "town" || !prefs.controls)
      for (const key of ["w", "a", "s", "d"]) engine.current?.key(key, false);
  }, [view, prefs.controls]);
  useEffect(() => {
    document.title = active ? clock(left) + " | Focus Town" : "Focus Town";
    return () => {
      document.title = "Focus Town";
    };
  }, [active, left]);
  useEffect(() => {
    const fn = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else
        setMessage(
          "This browser uses its own full-screen control. The town already fills this window.",
        );
    } catch {
      setMessage(
        "Full screen is blocked here. Open the game in its own browser tab, then try again.",
      );
    }
  };
  const begin = () => {
    if (!valid || room.busy) return;
    if (inRoom) {
      void room.control("start", currentPhase, minutes!);
      return;
    }
    if (!canSave) return;
    const id = crypto.randomUUID(),
      t = Date.now();
    update((s) =>
      s.cycle?.next === "break"
        ? cycleBreak(s, t, id)
        : s.cycle?.next === "focus" && s.cycle.completed > 0
          ? nextCycleFocus(s, t, id)
          : currentPhase === "focus"
            ? prefs.cycle
              ? beginCycle(
                  s,
                  {
                    focus: focus!,
                    short: short!,
                    long: long!,
                    rounds,
                    autoBreak: prefs.autoBreak,
                  },
                  t,
                  id,
                )
              : startFocus({ ...s, cycle: null }, focus!, t, id, short!)
            : startBreak(
                { ...s, cycle: null },
                minutes!,
                t,
                id,
                currentPhase === "long" ? "long" : "short",
              ),
    );
  };
  const togglePause = () => {
    if (inRoom) {
      void room.control(isPaused ? "resume" : "pause");
      return;
    }
    update((s) =>
      isPaused ? resumeTimer(s, Date.now()) : pauseTimer(s, Date.now()),
    );
  };
  const switchView = (next: "focus" | "town") => {
    setView(next);
    setZen(false);
    if (next === "town") requestAnimationFrame(() => engine.current?.focus());
  };
  const download = () => {
    const url = URL.createObjectURL(
        new Blob([exportRaw()], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download =
      "focus-town-save-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const upload = async (f?: File) => {
    if (!f) return;
    if (f.size > 2_000_000) {
      setMessage(
        "That backup is too large. Choose a Focus Town save under 2 MB.",
      );
      return;
    }
    try {
      const parsed = parseSave(await f.text());
      if (parsed.error) throw new Error(parsed.error);
      setBackup(parsed.save);
      setPanel("import");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not read that backup.",
      );
    }
    if (file.current) file.current.value = "";
  };
  const acknowledge = () => {
    setStorageNotice(false);
    try {
      localStorage.setItem("focus-town-storage-notice", "read");
    } catch {}
  };
  const copyInvite = async () => {
    if (!room.credentials?.invite) return;
    try {
      await navigator.clipboard.writeText(
        location.origin + "/#room=" + room.credentials.invite,
      );
      setMessage("Invite copied. Send it only to people you want in the room.");
    } catch {
      setMessage("Copy the invitation from the room panel.");
    }
  };
  const inputMinutes = (
    label: string,
    key: "focus" | "short" | "long" | "rounds",
  ) => (
    <label className="setting-row">
      <span>{label}</span>
      <span>
        <input
          type="number"
          min="1"
          max={key === "rounds" ? 12 : 720}
          step="1"
          value={prefs[key]}
          onChange={(e) => setting(key, e.target.value)}
          aria-label={label}
        />
        <small>{key === "rounds" ? "rounds" : "min"}</small>
      </span>
    </label>
  );
  const mainLabel = active
    ? isPaused
      ? "Resume"
      : "Pause"
    : inRoom
      ? rt?.status === "complete"
        ? "Start another interval"
        : "Start together"
      : cycle?.next === "break"
        ? "Start " + phaseLabel(currentPhase).toLowerCase()
        : cycle?.next === "focus" && cycle.completed > 0
          ? "Start round " + (cycle.completed + 1)
          : "Start " + phaseLabel(currentPhase).toLowerCase();
  const sessionTabs = (
    <div className="phase-tabs" role="group" aria-label="Session type">
      {(["focus", "short", "long"] as Phase[]).map((p) => (
        <button
          key={p}
          aria-pressed={currentPhase === p}
          disabled={active || (!inRoom && !!cycle && cycle.next !== "done")}
          onClick={() => setPhase(p)}
        >
          {phaseLabel(p)}
        </button>
      ))}
    </div>
  );
  const sessionActions = (
    <>
      <div className="timer-buttons">
        <Button
          className="start-button"
          variant="default"
          disabled={
            (!active && !valid) ||
            (inRoom
              ? !room.isHost || !room.connected || room.busy
              : !canSave || room.busy)
          }
          onClick={active ? togglePause : begin}
        >
          <Icon name={active && !isPaused ? "pause" : "play"} />
          {inRoom && !room.isHost ? "Host controls the timer" : mainLabel}
        </Button>
        {((active && (!inRoom || room.isHost)) || (!inRoom && !!planned)) && (
          <Button
            aria-label="End current session or plan"
            onClick={() => setPanel("cancel")}
          >
            {active ? "End" : "End plan"}
          </Button>
        )}
      </div>
      {!inRoom && cycle?.next === "break" && !timer && (
        <button className="small-link" onClick={() => update(skipCycleBreak)}>
          Skip break
        </button>
      )}
      {!inRoom && cycle?.next === "done" && !timer && (
        <p className="completion-line" role="status">
          All {cycle.rounds} rounds finished. Take your time.
        </p>
      )}
      {!inRoom && save.lastCompletion && !timer && (
        <p className="completion-line" role="status">
          {save.lastCompletion.focusMinutes} minutes saved · +
          {save.lastCompletion.rewards.xp} XP{" "}
          <button
            aria-label="Dismiss session result"
            onClick={() => update(dismissCompletion)}
          ></button>
        </p>
      )}
    </>
  );
  return (
    <main
      className={
        "app-scene " +
        (view === "town" ? "town-view " : "") +
        (zen ? "zen " : "") +
        (prefs.quiet ? "reduced-motion" : "")
      }
    >
      <img
        className="scene-backdrop"
        src="/art/observatory.png"
        alt=""
        fetchPriority="high"
      />
      <div className="world-stage" hidden={view !== "town"}>
        <canvas
          ref={canvas}
          width="960"
          height="600"
          tabIndex={0}
          aria-label="Greenvale. Use WASD or arrow keys to walk. E interacts."
          onClick={() => engine.current?.focus()}
        />
      </div>
      <header className="topbar">
        <button className="wordmark" onClick={() => setPanel("story")}>
          focus town<span>GREENVALE</span>
        </button>
        <nav className="view-switch" aria-label="Views">
          <Button
            aria-pressed={view === "focus"}
            onClick={() => switchView("focus")}
          >
            Focus
          </Button>
          <Button
            aria-pressed={view === "town"}
            onClick={() => switchView("town")}
          >
            Town
          </Button>
        </nav>
        <div className="local-clock">
          <time dateTime={new Date(now).toISOString()}>
            {new Date(now).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: !prefs.hour24,
            })}
          </time>
          <span>
            {new Date(now).toLocaleDateString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </header>
      {view === "focus" && (
        <section className="focus-space" aria-label="Focus timer">
          {sessionTabs}
          <label className="task-line">
            <span className="sr-only">Your current task</span>
            <input
              value={prefs.task}
              maxLength={120}
              placeholder="What are you working on?"
              onChange={(e) => setting("task", e.target.value)}
            />
          </label>
          <div
            className="hero-clock"
            role="timer"
            aria-label={phaseLabel(currentPhase) + " " + clock(left)}
          >
            {clock(left)}
          </div>
          <div className="round-line">
            {inRoom ? (
              <span>
                {room.connected ? "Together in Greenvale" : "Reconnecting"} ·{" "}
                {room.snapshot?.members.filter((m) => m.online).length ?? 0}{" "}
                here
              </span>
            ) : (
              <>
                <span>
                  {cycle && cycle.next !== "done"
                    ? "Round " +
                      Math.min(
                        cycle.completed + (currentPhase === "focus" ? 1 : 0),
                        cycle.rounds,
                      ) +
                      " of " +
                      cycle.rounds
                    : prefs.cycle && phase === "focus"
                      ? rounds +
                        " rounds · " +
                        prefs.focus +
                        " / " +
                        prefs.short +
                        " / " +
                        prefs.long
                      : phaseLabel(phase)}
                </span>
                <button onClick={() => setPanel("sessions")} disabled={active}>
                  Edit
                </button>
              </>
            )}
          </div>
          {sessionActions}
          {inRoom && room.snapshot && (
            <p className="completion-line">
              {room.snapshot.sharedMinutes} shared minutes · the river beacon
            </p>
          )}
        </section>
      )}
      {view === "town" && (
        <>
          <div className="town-label">
            <span>{scene === "village" ? "Greenvale" : "Lantern House"}</span>
            <small>
              {getWorldClock(now).label} ·{" "}
              {String(getWorldClock(now).hour).padStart(2, "0")}:
              {String(getWorldClock(now).minute).padStart(2, "0")}
            </small>
          </div>
          <section className="town-session" aria-label="Town timer">
            <button
              className="town-session-heading"
              aria-expanded={townTimerOpen}
              aria-controls="town-session-body"
              onClick={() => setTownTimerOpen((v) => !v)}
            >
              <span>{active ? phaseLabel(currentPhase) : "Your session"}</span>
              <span>{townTimerOpen ? "Hide" : clock(left) + " · Open"}</span>
            </button>
            {townTimerOpen && (
              <div id="town-session-body">
                {sessionTabs}
                <div
                  className="town-session-clock"
                  role="timer"
                  aria-label={phaseLabel(currentPhase) + " " + clock(left)}
                >
                  {clock(left)}
                </div>
                <div className="town-session-options">
                  <span>
                    {!inRoom && prefs.cycle
                      ? cycle
                        ? Math.min(
                            cycle.completed +
                              (currentPhase === "focus" ? 1 : 0),
                            cycle.rounds,
                          ) +
                          " / " +
                          cycle.rounds +
                          " rounds"
                        : rounds + " rounds"
                      : phaseLabel(currentPhase)}
                  </span>
                  <button onClick={() => setPanel("sessions")}>
                    Set sessions
                  </button>
                </div>
                {sessionActions}
              </div>
            )}
          </section>
          {nearby && !active && !panel && (
            <button
              className="interact-prompt"
              onClick={() => engine.current?.interact()}
            >
              <kbd>E</kbd>
              {nearby.label}
            </button>
          )}
          {prefs.controls && (
            <div className="controls-hint">
              <span>WASD move · E interact</span>
              <button
                aria-label="Hide controls"
                onClick={() => setting("controls", false)}
              ></button>
            </div>
          )}
          {prefs.controls && (
            <div className="touch-pad">
              {[
                ["w", "Up"],
                ["a", "Left"],
                ["s", "Down"],
                ["d", "Right"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  aria-label={"Walk " + label.toLowerCase()}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    engine.current?.key(key, true);
                  }}
                  onPointerUp={() => engine.current?.key(key, false)}
                  onPointerCancel={() => engine.current?.key(key, false)}
                >
                  {label}
                </button>
              ))}
              <button onClick={() => engine.current?.interact()}>Use</button>
            </div>
          )}
        </>
      )}
      {!zen && (
        <>
          <button className="chapter-teaser" onClick={() => setPanel("story")}>
            <span>CHAPTER {CHAPTERS.indexOf(chapter) + 1}</span>
            <strong>{chapter.title}</strong>
          </button>
          <button className="today-teaser" onClick={() => setPanel("journal")}>
            <strong>
              {progress.todayMinutes}
              <small> min today</small>
            </strong>
            <span>{progress.currentStreak} day streak</span>
          </button>
        </>
      )}
      <nav className="bottom-dock" aria-label="Town tools">
        <Button
          onClick={() => setPanel("sessions")}
          aria-label="Session settings"
        >
          <Icon name="focus" />
          <span>Sessions</span>
        </Button>
        <Button onClick={() => setPanel("coop")} aria-label="Focus together">
          <Icon name="people" />
          <span>Together</span>
          {inRoom && (
            <small>
              {room.snapshot?.members.filter((m) => m.online).length ?? 1}
            </small>
          )}
        </Button>
        <Button onClick={() => setPanel("journal")}>
          <Icon name="journal" />
          <span>Journal</span>
        </Button>
        <Button onClick={() => setPanel("settings")} aria-label="Settings">
          <Icon name="settings" />
        </Button>
        <Button
          onClick={() => setZen((v) => !v)}
          aria-label={zen ? "Show details" : "Hide details"}
          aria-pressed={zen}
        >
          <Icon name="leaf" />
        </Button>
        <Button
          onClick={() => void toggleFullscreen()}
          aria-label={fullscreen ? "Exit full screen" : "Enter full screen"}
        >
          <Icon name="expand" />
        </Button>
      </nav>
      {storageNotice && !panel && (
        <aside className="storage-notice">
          <button onClick={() => setPanel("settings")}>
            Saved on this device
          </button>
          <button
            aria-label="Dismiss storage notice"
            onClick={acknowledge}
          ></button>
        </aside>
      )}
      {(notice || room.error || message) && (
        <div className="toast" role="status">
          <span>{notice || room.error || message}</span>
          {!notice && !room.error && (
            <button
              aria-label="Dismiss message"
              onClick={() => setMessage("")}
            ></button>
          )}
        </div>
      )}
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      {panel === "sessions" && (
        <Modal title="Set your session" onClose={close}>
          {sessionTabs}
          <p className="muted">
            Choose a rhythm. Leave the next round for when you are ready.
          </p>
          <div className="preset-list">
            {[
              {
                name: "A small start",
                focus: 15,
                short: 3,
                long: 10,
                rounds: 4,
              },
              { name: "Pomodoro", focus: 25, short: 5, long: 15, rounds: 4 },
              { name: "Deep work", focus: 50, short: 10, long: 20, rounds: 3 },
              {
                name: "One long stretch",
                focus: 90,
                short: 15,
                long: 30,
                rounds: 1,
              },
            ].map((p) => (
              <button
                key={p.name}
                disabled={active || !!planned}
                onClick={() =>
                  setPrefs((v) => ({
                    ...v,
                    focus: String(p.focus),
                    short: String(p.short),
                    long: String(p.long),
                    rounds: String(p.rounds),
                    cycle: true,
                  }))
                }
              >
                <span>{p.name}</span>
                <small>
                  {p.focus} / {p.short} / {p.long}
                </small>
              </button>
            ))}
          </div>
          <fieldset disabled={active || !!planned}>
            {inputMinutes("Focus", "focus")}
            {inputMinutes("Short break", "short")}
            {inputMinutes("Long break", "long")}
            {inputMinutes("Rounds before long break", "rounds")}
            <label className="check-row">
              <input
                type="checkbox"
                checked={prefs.cycle}
                onChange={(e) => setting("cycle", e.target.checked)}
              />
              Use Pomodoro rounds
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={prefs.autoBreak}
                onChange={(e) => setting("autoBreak", e.target.checked)}
              />
              Start breaks automatically
            </label>
          </fieldset>
          {!valid && (
            <p className="error">Use 1–720 whole minutes and 1–12 rounds.</p>
          )}
          {planned && (
            <p className="fine-print">End this plan to change its intervals.</p>
          )}
          <p className="fine-print">
            The next focus round starts when you press Start. Co-op intervals
            are controlled by the host.
          </p>
          <Button variant="default" disabled={!valid} onClick={close}>
            Save settings
          </Button>
          {!active && (
            <Button
              disabled={
                !valid ||
                (inRoom
                  ? !room.isHost || !room.connected || room.busy
                  : !canSave || room.busy)
              }
              onClick={() => {
                if (valid) {
                  begin();
                  close();
                }
              }}
            >
              {mainLabel}
            </Button>
          )}
        </Modal>
      )}
      {panel === "journal" && (
        <Modal title="Your time, kept." onClose={close} wide>
          <div className="journal-totals">
            <div>
              <strong>{progress.totalMinutes}</strong>
              <span>minutes</span>
            </div>
            <div>
              <strong>{progress.currentStreak}</strong>
              <span>day streak</span>
            </div>
            <div>
              <strong>{progress.bestStreak}</strong>
              <span>best streak</span>
            </div>
          </div>
          <div className="week-chart">
            {progress.weekActivity.map((d) => (
              <div
                key={d.date}
                className={d.isToday ? "today" : ""}
                aria-label={d.date + ": " + d.minutes + " minutes"}
              >
                <span>{d.minutes}</span>
                <div className="bar-track">
                  <i
                    style={{
                      height:
                        Math.max(
                          3,
                          Math.min(
                            100,
                            (d.minutes /
                              Math.max(
                                25,
                                ...progress.weekActivity.map((a) => a.minutes),
                              )) *
                              100,
                          ),
                        ) + "%",
                    }}
                  />
                </div>
                <small>
                  {new Date(d.date + "T12:00:00").toLocaleDateString([], {
                    weekday: "short",
                  })}
                </small>
              </div>
            ))}
          </div>
          <p className="fine-print">
            25 completed minutes makes a streak day. Your streak stays open
            until midnight.
          </p>
          <div className="journal-meta">
            <span>Level {progress.level}</span>
            <span>{save.coins} coins</span>
            <span>{save.energy} energy</span>
          </div>
          <h3>Recent sessions</h3>
          {save.sessions.length ? (
            <ul className="session-list">
              {save.sessions
                .slice(-6)
                .reverse()
                .map((s) => (
                  <li key={s.id}>
                    <span>
                      {new Date(s.completedAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <b>{s.minutes} min</b>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="muted">
              Your first finished session will appear here.
            </p>
          )}
        </Modal>
      )}
      {panel === "story" && (
        <Modal title={chapter.title} onClose={close}>
          <p className="eyebrow">
            CHAPTER {CHAPTERS.indexOf(chapter) + 1} · {chapter.place}
          </p>
          <p className="story-copy">{chapter.text}</p>
          <div className="quest-progress">
            <span>{chapter.goal}</span>
            <span>
              {Math.min(progress.totalMinutes, chapter.target)} /{" "}
              {chapter.target} min
            </span>
            <progress
              value={Math.min(progress.totalMinutes, chapter.target)}
              max={chapter.target}
            />
          </div>
          <p className="fine-print">
            Finished solo sessions uncover the next part of Greenvale’s story.
          </p>
          <Button
            variant="default"
            onClick={() => {
              switchView("town");
              setPanel(null);
            }}
          >
            Visit the town
          </Button>
        </Modal>
      )}
      {panel === "settings" && (
        <Modal title="Settle in." onClose={close}>
          <label className="check-row">
            <input
              type="checkbox"
              checked={prefs.controls}
              onChange={(e) => setting("controls", e.target.checked)}
            />
            Show movement controls
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={prefs.quiet}
              onChange={(e) => setting("quiet", e.target.checked)}
            />
            Reduce motion
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={prefs.hour24}
              onChange={(e) => setting("hour24", e.target.checked)}
            />
            24-hour clock
          </label>
          <h3>Your save</h3>
          <p>
            Sessions, coins, story progress and settings stay in this browser on
            this device. Clearing site data removes them. Download a backup
            before moving browsers.
          </p>
          <div className="button-row">
            <Button variant="outline" onClick={download}>
              Export save
            </Button>
            <Button
              variant="outline"
              disabled={active || inRoom || room.busy || !canRestore}
              onClick={() => file.current?.click()}
            >
              Import save
            </Button>
          </div>
          <p className="fine-print">
            Co-op rooms share your nickname, character position and timer with
            invited players. They do not sync your personal save.
          </p>
          <div className="legal-links">
            <a href="/privacy">Privacy</a>
            <a href="/cookies">Storage & cookies</a>
            <a href="/terms">Terms</a>
          </div>
        </Modal>
      )}
      {panel === "coop" && (
        <Modal title="Keep each other company." onClose={close}>
          <p className="muted">
            Walk together, share a timer, light the river beacon.
          </p>
          {!inRoom ? (
            <>
              <label className="text-field">
                Your nickname
                <input
                  value={name}
                  maxLength={24}
                  placeholder="A name for this room"
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <Button
                variant="default"
                disabled={!!timer || room.busy || !name.trim()}
                onClick={() => void room.enter(name)}
              >
                Create a room
              </Button>
              <label className="text-field">
                Invitation
                <input
                  value={invite}
                  maxLength={240}
                  placeholder="Paste an invitation or invite link"
                  onChange={(e) =>
                    setInvite(
                      e.target.value.includes("#room=")
                        ? e.target.value.split("#room=")[1]
                        : e.target.value,
                    )
                  }
                />
              </label>
              <Button
                variant="outline"
                disabled={
                  !!timer || room.busy || !name.trim() || !invite.trim()
                }
                onClick={() => void room.enter(name, invite.trim())}
              >
                Join room
              </Button>
              {timer && (
                <p className="fine-print">
                  Finish or end your solo session before joining.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="connection-state">
                {room.connected ? "Connected" : "Reconnecting"} ·{" "}
                {room.isHost ? "You are the host" : "Guest"}
              </p>
              <ul className="party-list">
                {room.snapshot?.members.map((m) => (
                  <li key={m.id}>
                    <span className="avatar-letter">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      {m.name}
                      {m.id === room.snapshot?.hostId ? " · host" : ""}
                    </span>
                    <small>{m.online ? "here" : "away"}</small>
                  </li>
                ))}
              </ul>
              {room.credentials?.invite && (
                <>
                  <Button variant="outline" onClick={() => void copyInvite()}>
                    Copy invitation
                  </Button>
                  <input
                    className="invite-value"
                    readOnly
                    aria-label="Room invitation"
                    value={
                      location.origin + "/#room=" + room.credentials.invite
                    }
                  />
                </>
              )}
              <p>
                {room.snapshot?.sharedMinutes ?? 0} shared focus minutes have
                reached the river beacon.
              </p>
              <Button
                variant="default"
                onClick={() => {
                  setView("focus");
                  close();
                }}
              >
                Go to shared timer
              </Button>
              <Button disabled={room.busy} onClick={() => void room.leave()}>
                {room.isHost ? "Close room" : "Leave room"}
              </Button>
            </>
          )}
          {room.error && (
            <p className="error" role="status">
              {room.error}
            </p>
          )}
          <p className="fine-print">
            Rooms last up to 24 hours. Anyone with the invitation can join. Room
            time is shared; your personal journal stays separate.
          </p>
        </Modal>
      )}
      {panel === "cancel" && (
        <Modal title="End this interval?" onClose={close}>
          <p>
            {inRoom
              ? "The room will return to idle for everyone."
              : "Unfinished focus time earns no rewards. Completed sessions stay saved."}
          </p>
          <div className="button-row">
            <Button onClick={close}>Keep going</Button>
            <Button
              variant="default"
              disabled={inRoom && !room.isHost}
              onClick={() => {
                if (inRoom) void room.control("reset");
                else
                  update((s) => ({
                    ...cancelTimer(s, Date.now()),
                    cycle: null,
                  }));
                close();
              }}
            >
              End interval
            </Button>
          </div>
        </Modal>
      )}
      {panel === "import" && backup && (
        <Modal title="Replace this device’s save?" onClose={close}>
          <p>
            The backup contains {backup.sessions.length} sessions and{" "}
            {backup.coins} coins. Export your current save first if you want to
            keep it.
          </p>
          <div className="button-row">
            <Button onClick={download}>Export current save</Button>
            <Button
              variant="default"
              onClick={() => {
                if (restore(backup)) {
                  setBackup(null);
                  close();
                  setMessage("Backup restored.");
                }
              }}
            >
              Restore backup
            </Button>
          </div>
        </Modal>
      )}
      {panel && typeof panel === "object" && (
        <Modal title={panel.title ?? panel.label} onClose={close}>
          {panel.lines?.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          {(panel.id === "mira" || panel.id === "library") && (
            <Button onClick={() => setPanel("journal")}>Open journal</Button>
          )}
          {(panel.id === "atlas" ||
            panel.id === "bell" ||
            panel.id === "rowan") && (
            <Button onClick={() => setPanel("story")}>The missing hour</Button>
          )}
          <Button variant="default" onClick={close}>
            Back to town
          </Button>
        </Modal>
      )}
    </main>
  );
}
