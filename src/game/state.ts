import {
  validAppearance,
  validLightMode,
  validMotivation,
  type Appearance,
  type LightMode,
  type MotivationMode,
} from "./personalization.js";
import { validDiscoveries, type DiscoveryId } from "./discoveries.js";
import {
  validUpgrades,
  validMissionClaims,
  validStreakClaims,
  type UpgradeId,
  type MissionId,
} from "./townCatalog.js";
export type FocusMinutes = number;
export type BreakMinutes = number;
export type Rewards = { energy: number; xp: number; coins: number };
export const MIN_MINUTES = 1,
  MAX_MINUTES = 720,
  DAILY_GOAL_MINUTES = 25;
export const REWARDS: Record<number, Rewards> = {
  15: { energy: 15, xp: 12, coins: 6 },
  25: { energy: 25, xp: 25, coins: 12 },
  45: { energy: 45, xp: 50, coins: 22 },
  60: { energy: 60, xp: 70, coins: 30 },
};
export const BREAK_MINUTES: Record<number, BreakMinutes> = {
  15: 3,
  25: 5,
  45: 8,
  60: 10,
};
export type Timer = {
  coffeeFocusMs?: number;
  id: string;
  kind: "focus" | "break";
  durationMinutes: number;
  status: "running" | "paused";
  startedAt: number;
  endAt: number | null;
  remainingMs: number;
  breakMinutes?: BreakMinutes;
  breakType?: "short" | "long";
};
export type CompletedSession = {
  id: string;
  minutes: FocusMinutes;
  completedAt: number;
  localDate: string;
};
export type Completion = {
  coffeeFocusMs?: number;
  id: string;
  focusMinutes: FocusMinutes;
  breakMinutes: BreakMinutes;
  rewards: Rewards;
};
export type Cycle = {
  focus: number;
  short: number;
  long: number;
  rounds: number;
  completed: number;
  next: "focus" | "break" | "done";
  autoBreak: boolean;
};
export type SaveData = {
  appearance?: Appearance;
  lighting?: LightMode;
  motivation?: MotivationMode;
  coffee?: { startedAt: number; endsAt: number };
  characterName?: string;
  discoveries?: DiscoveryId[];
  upgrades?: UpgradeId[];
  missionClaims?: MissionId[];
  streakClaims?: number[];
  cycle?: Cycle | null;
  version: 1;
  coins: number;
  energy: number;
  xp: number;
  sessions: CompletedSession[];
  timer: Timer | null;
  lastCompletion: Completion | null;
};
export type ActivityDay = {
  date: string;
  minutes: number;
  goalMet: boolean;
  isToday: boolean;
};
export const SAVE_KEY = "focusraid-save-v1";
export const createSave = (): SaveData => ({
  version: 1,
  coins: 0,
  energy: 0,
  xp: 0,
  sessions: [],
  timer: null,
  lastCompletion: null,
});
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const count = (x: unknown): x is number =>
  Number.isSafeInteger(x) && (x as number) >= 0;
const time = (x: unknown): x is number => count(x) && x <= 8640000000000000;
const id = (x: unknown): x is string =>
  typeof x === "string" && /^[a-zA-Z0-9_-]{1,120}$/.test(x);
export const isValidMinutes = (x: unknown): x is number =>
  Number.isSafeInteger(x) &&
  (x as number) >= MIN_MINUTES &&
  (x as number) <= MAX_MINUTES;
export function parseMinutes(input: unknown): number | null {
  if (typeof input === "number") return isValidMinutes(input) ? input : null;
  if (typeof input !== "string" || !/^\d+$/.test(input.trim())) return null;
  const minutes = Number(input.trim());
  return isValidMinutes(minutes) ? minutes : null;
}
export function getRewards(minutes: FocusMinutes): Rewards {
  if (!isValidMinutes(minutes))
    throw new RangeError("Choose 1 to 720 whole minutes.");
  const anchors = [0, 15, 25, 45, 60];
  let upper = anchors.findIndex((value) => value >= minutes);
  if (upper < 1) upper = anchors.length - 1;
  const lowMinutes = anchors[upper - 1],
    highMinutes = anchors[upper];
  const low = REWARDS[lowMinutes] ?? { energy: 0, xp: 0, coins: 0 },
    high = REWARDS[highMinutes];
  const fraction = (minutes - lowMinutes) / (highMinutes - lowMinutes);
  return {
    energy: minutes,
    xp: Math.round(low.xp + (high.xp - low.xp) * fraction),
    coins: Math.round(low.coins + (high.coins - low.coins) * fraction),
  };
}
export function recommendedBreakMinutes(minutes: FocusMinutes): BreakMinutes {
  if (!isValidMinutes(minutes))
    throw new RangeError("Choose 1 to 720 whole minutes.");
  if (minutes <= 15) return Math.max(1, Math.round(minutes / 5));
  if (minutes >= 60) return 10;
  const anchors = [15, 25, 45, 60],
    upper = anchors.findIndex((value) => value >= minutes);
  const low = anchors[upper - 1],
    high = anchors[upper],
    fraction = (minutes - low) / (high - low);
  return Math.round(
    BREAK_MINUTES[low] + (BREAK_MINUTES[high] - BREAK_MINUTES[low]) * fraction,
  );
}
export function localDateKey(timestamp: number) {
  const d = new Date(timestamp);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
function dateKey(x: unknown): x is string {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const d = new Date(x + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x;
}
function validTimer(x: unknown): x is Timer {
  if (
    !record(x) ||
    !id(x.id) ||
    !time(x.startedAt) ||
    !count(x.remainingMs) ||
    x.remainingMs <= 0 ||
    !isValidMinutes(x.durationMinutes)
  )
    return false;
  if (x.kind !== "focus" && x.kind !== "break") return false;
  if (
    x.breakType !== undefined &&
    (x.kind !== "break" || (x.breakType !== "short" && x.breakType !== "long"))
  )
    return false;
  if (
    x.breakMinutes !== undefined &&
    (x.kind !== "focus" || !isValidMinutes(x.breakMinutes))
  )
    return false;
  if (x.remainingMs > x.durationMinutes * 60000) return false;
  if (
    x.coffeeFocusMs !== undefined &&
    (!count(x.coffeeFocusMs) ||
      x.coffeeFocusMs > x.durationMinutes * 60000 - x.remainingMs)
  )
    return false;
  return x.status === "paused"
    ? x.endAt === null
    : x.status === "running" &&
        time(x.endAt) &&
        x.endAt === x.startedAt + x.remainingMs;
}
export function characterNameFrom(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.trim();
  return name.length > 0 &&
    name.length <= 24 &&
    !/[\u0000-\u001f\u007f-\u009f]/.test(name)
    ? name
    : null;
}
function validSave(x: unknown): x is SaveData {
  if (
    !record(x) ||
    x.version !== 1 ||
    !count(x.coins) ||
    !count(x.energy) ||
    !count(x.xp) ||
    !Array.isArray(x.sessions)
  )
    return false;
  if (
    x.characterName !== undefined &&
    characterNameFrom(x.characterName) !== x.characterName
  )
    return false;
  if (x.appearance !== undefined && !validAppearance(x.appearance))
    return false;
  if (x.lighting !== undefined && !validLightMode(x.lighting)) return false;
  if (x.motivation !== undefined && !validMotivation(x.motivation))
    return false;
  if (
    x.coffee !== undefined &&
    (!record(x.coffee) ||
      !time(x.coffee.startedAt) ||
      !time(x.coffee.endsAt) ||
      x.coffee.endsAt - x.coffee.startedAt !== COFFEE_DURATION)
  )
    return false;
  if (x.discoveries !== undefined && !validDiscoveries(x.discoveries))
    return false;
  if (x.upgrades !== undefined && !validUpgrades(x.upgrades)) return false;
  if (x.missionClaims !== undefined && !validMissionClaims(x.missionClaims))
    return false;
  if (x.streakClaims !== undefined && !validStreakClaims(x.streakClaims))
    return false;
  if (x.cycle !== undefined && x.cycle !== null && !validCycle(x.cycle))
    return false;
  const ids = new Set<string>();
  for (const s of x.sessions) {
    if (
      !record(s) ||
      !id(s.id) ||
      ids.has(s.id) ||
      !isValidMinutes(s.minutes) ||
      !time(s.completedAt) ||
      !dateKey(s.localDate)
    )
      return false;
    ids.add(s.id);
  }
  if (x.timer !== null && (!validTimer(x.timer) || ids.has(x.timer.id)))
    return false;
  if (x.lastCompletion !== null) {
    const c = x.lastCompletion;
    if (
      !record(c) ||
      !id(c.id) ||
      !isValidMinutes(c.focusMinutes) ||
      !isValidMinutes(c.breakMinutes) ||
      !record(c.rewards)
    )
      return false;
    if (
      c.coffeeFocusMs !== undefined &&
      (!count(c.coffeeFocusMs) || c.coffeeFocusMs > c.focusMinutes * 60000)
    )
      return false;
    const r = rewardsWithCoffee(c.focusMinutes, Number(c.coffeeFocusMs ?? 0));
    if (
      c.rewards.energy !== r.energy ||
      c.rewards.xp !== r.xp ||
      c.rewards.coins !== r.coins ||
      !x.sessions.some((s) => s.id === c.id && s.minutes === c.focusMinutes)
    )
      return false;
  }
  return true;
}
export function parseSave(raw: string | null): {
  save: SaveData;
  error: string | null;
} {
  if (raw === null) return { save: createSave(), error: null };
  try {
    const value: unknown = JSON.parse(raw);
    if (validSave(value)) return { save: value, error: null };
    return {
      save: createSave(),
      error:
        "This save is from another version or has damaged data. The original has been kept.",
    };
  } catch {
    return {
      save: createSave(),
      error: "This save could not be read. The original has been kept.",
    };
  }
}
export const serializeSave = (save: SaveData) => JSON.stringify(save);
export function remainingMs(timer: Timer, now: number) {
  return timer.status === "paused"
    ? timer.remainingMs
    : Math.max(0, Math.min(timer.remainingMs, (timer.endAt ?? now) - now));
}
export function settleTimer(save: SaveData, now: number): SaveData {
  const t = save.timer;
  if (
    !time(now) ||
    !t ||
    t.status !== "running" ||
    t.endAt === null ||
    now < t.endAt
  )
    return save;
  if (t.kind === "break")
    return {
      ...save,
      timer: null,
      cycle: save.cycle
        ? {
            ...save.cycle,
            next: save.cycle.completed >= save.cycle.rounds ? "done" : "focus",
          }
        : save.cycle,
    };
  if (save.sessions.some((s) => s.id === t.id)) return { ...save, timer: null };
  const minutes = t.durationMinutes,
    coffeeFocusMs = Math.min(
      minutes * 60000,
      (t.coffeeFocusMs ?? 0) + coffeeOverlap(save, t, t.endAt),
    ),
    r = rewardsWithCoffee(minutes, coffeeFocusMs);
  if (
    !count(save.coins + r.coins) ||
    !count(save.energy + r.energy) ||
    !count(save.xp + r.xp)
  )
    return { ...save, timer: null };
  const cycle: Cycle | null =
    save.cycle && save.cycle.next !== "done"
      ? {
          ...save.cycle,
          completed: Math.min(save.cycle.rounds, save.cycle.completed + 1),
          next: "break",
        }
      : null;
  const rest = cycle
    ? cycle.completed >= cycle.rounds
      ? cycle.long
      : cycle.short
    : (t.breakMinutes ?? recommendedBreakMinutes(minutes));
  const next: SaveData = {
    ...save,
    cycle,
    timer: null,
    coins: save.coins + r.coins,
    energy: save.energy + r.energy,
    xp: save.xp + r.xp,
    sessions: [
      ...save.sessions,
      {
        id: t.id,
        minutes,
        completedAt: t.endAt,
        localDate: localDateKey(t.endAt),
      },
    ],
    lastCompletion: {
      id: t.id,
      focusMinutes: minutes,
      coffeeFocusMs,
      breakMinutes: rest,
      rewards: r,
    },
  };
  let restId = "rest_" + t.id.slice(0, 100),
    suffix = 0;
  while (next.sessions.some((s) => s.id === restId))
    restId = "rest_" + t.id.slice(0, 100) + "_" + ++suffix;
  return cycle?.autoBreak && time(now + rest * 60000)
    ? {
        ...next,
        lastCompletion: null,
        timer: {
          id: restId,
          kind: "break",
          breakType: cycle.completed >= cycle.rounds ? "long" : "short",
          durationMinutes: rest,
          status: "running",
          startedAt: now,
          endAt: now + rest * 60000,
          remainingMs: rest * 60000,
        },
      }
    : next;
}
function start(
  save: SaveData,
  kind: Timer["kind"],
  minutes: number,
  now: number,
  sessionId: string,
  breakMinutes?: BreakMinutes,
): SaveData {
  const ready = settleTimer(save, now);
  if (
    ready.timer ||
    !time(now) ||
    !id(sessionId) ||
    !time(now + minutes * 60000) ||
    ready.sessions.some((s) => s.id === sessionId)
  )
    return ready;
  const timer: Timer = {
    id: sessionId,
    kind,
    durationMinutes: minutes,
    status: "running",
    startedAt: now,
    endAt: now + minutes * 60000,
    remainingMs: minutes * 60000,
  };
  if (kind === "focus") timer.breakMinutes = breakMinutes;
  return { ...ready, lastCompletion: null, timer };
}
export function startFocus(
  save: SaveData,
  minutes: FocusMinutes,
  now: number,
  sessionId: string,
  breakMinutes?: BreakMinutes,
) {
  if (
    !isValidMinutes(minutes) ||
    (breakMinutes !== undefined && !isValidMinutes(breakMinutes))
  )
    return save;
  return start(
    save,
    "focus",
    minutes,
    now,
    sessionId,
    breakMinutes ?? recommendedBreakMinutes(minutes),
  );
}
export function startBreak(
  save: SaveData,
  minutes: BreakMinutes,
  now: number,
  sessionId: string,
  breakType: "short" | "long" = "short",
) {
  if (!isValidMinutes(minutes)) return save;
  const next = start(save, "break", minutes, now, sessionId);
  return next.timer?.id === sessionId && next !== save
    ? { ...next, timer: { ...next.timer, breakType } }
    : next;
}
export function pauseFocus(save: SaveData, now: number): SaveData {
  const ready = settleTimer(save, now),
    t = ready.timer;
  if (!time(now) || !t || t.kind !== "focus" || t.status !== "running")
    return ready;
  return {
    ...ready,
    timer: {
      ...t,
      status: "paused",
      coffeeFocusMs: (t.coffeeFocusMs ?? 0) + coffeeOverlap(ready, t, now),
      endAt: null,
      remainingMs: remainingMs(t, now),
    },
  };
}
export function resumeFocus(save: SaveData, now: number): SaveData {
  const t = save.timer;
  if (
    !t ||
    t.kind !== "focus" ||
    t.status !== "paused" ||
    !time(now) ||
    !time(now + t.remainingMs)
  )
    return save;
  return {
    ...save,
    timer: {
      ...t,
      status: "running",
      startedAt: now,
      endAt: now + t.remainingMs,
    },
  };
}
export function cancelTimer(save: SaveData, now: number): SaveData {
  const ready = settleTimer(save, now);
  return ready.timer ? { ...ready, timer: null } : ready;
}
export const dismissCompletion = (save: SaveData): SaveData =>
  save.lastCompletion ? { ...save, lastCompletion: null } : save;
export function getProgress(save: SaveData, now: number) {
  const totals = new Map<string, number>();
  for (const s of save.sessions)
    totals.set(s.localDate, (totals.get(s.localDate) ?? 0) + s.minutes);
  const today = localDateKey(now),
    ordinal = (key: string) => Date.parse(key + "T00:00:00Z") / 86400000,
    todayDay = ordinal(today);
  const days = [...totals]
    .filter(
      ([key, minutes]) =>
        minutes >= DAILY_GOAL_MINUTES && ordinal(key) <= todayDay,
    )
    .map(([key]) => ordinal(key))
    .sort((a, b) => a - b);
  let run = 0,
    best = 0,
    last = -Infinity;
  for (const day of days) {
    run = day === last + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    last = day;
  }
  const weekActivity: ActivityDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date((todayDay - 6 + index) * 86400000)
        .toISOString()
        .slice(0, 10),
      minutes = totals.get(date) ?? 0;
    return {
      date,
      minutes,
      goalMet: minutes >= DAILY_GOAL_MINUTES,
      isToday: date === today,
    };
  });
  return {
    level: Math.floor(save.xp / 100) + 1,
    currentStreak: last >= todayDay - 1 ? run : 0,
    bestStreak: best,
    todayMinutes: totals.get(today) ?? 0,
    totalMinutes: save.sessions.reduce((n, s) => n + s.minutes, 0),
    dailyGoalMinutes: DAILY_GOAL_MINUTES,
    weekActivity,
  };
}

export function validCycle(x: unknown): x is Cycle {
  return (
    record(x) &&
    isValidMinutes(x.focus) &&
    isValidMinutes(x.short) &&
    isValidMinutes(x.long) &&
    Number.isSafeInteger(x.rounds) &&
    Number(x.rounds) >= 1 &&
    Number(x.rounds) <= 12 &&
    count(x.completed) &&
    x.completed <= Number(x.rounds) &&
    typeof x.next === "string" &&
    ["focus", "break", "done"].includes(x.next) &&
    typeof x.autoBreak === "boolean"
  );
}
export function beginCycle(
  save: SaveData,
  config: Omit<Cycle, "completed" | "next">,
  now: number,
  sessionId: string,
): SaveData {
  const cycle: Cycle = { ...config, completed: 0, next: "focus" };
  if (save.timer || !validCycle(cycle)) return save;
  return startFocus(
    { ...save, cycle },
    cycle.focus,
    now,
    sessionId,
    cycle.rounds === 1 ? cycle.long : cycle.short,
  );
}
export function nextCycleFocus(
  save: SaveData,
  now: number,
  sessionId: string,
): SaveData {
  const c = save.cycle;
  if (!c || c.next !== "focus" || c.completed >= c.rounds || save.timer)
    return save;
  return startFocus(
    save,
    c.focus,
    now,
    sessionId,
    c.completed + 1 >= c.rounds ? c.long : c.short,
  );
}
export function cycleBreak(
  save: SaveData,
  now: number,
  sessionId: string,
): SaveData {
  const c = save.cycle;
  if (!c || c.next !== "break" || save.timer) return save;
  return startBreak(
    save,
    c.completed >= c.rounds ? c.long : c.short,
    now,
    sessionId,
    c.completed >= c.rounds ? "long" : "short",
  );
}
export function skipCycleBreak(save: SaveData): SaveData {
  if (
    !save.cycle ||
    save.cycle.next !== "break" ||
    save.timer?.kind === "focus"
  )
    return save;
  return {
    ...save,
    timer: null,
    lastCompletion: null,
    cycle: {
      ...save.cycle,
      next: save.cycle.completed >= save.cycle.rounds ? "done" : "focus",
    },
  };
}
export function pauseTimer(save: SaveData, now: number): SaveData {
  const ready = settleTimer(save, now),
    t = ready.timer;
  if (!t || t.status !== "running" || !time(now)) return ready;
  return {
    ...ready,
    timer: {
      ...t,
      status: "paused",
      coffeeFocusMs: (t.coffeeFocusMs ?? 0) + coffeeOverlap(ready, t, now),
      endAt: null,
      remainingMs: remainingMs(t, now),
    },
  };
}
export function resumeTimer(save: SaveData, now: number): SaveData {
  const t = save.timer;
  if (!t || t.status !== "paused" || !time(now) || !time(now + t.remainingMs))
    return save;
  return {
    ...save,
    timer: {
      ...t,
      status: "running",
      startedAt: now,
      endAt: now + t.remainingMs,
    },
  };
}

export const COFFEE_PRICE = 6;
export const COFFEE_DURATION = 30 * 60000;
export function coffeeActive(save: Pick<SaveData, "coffee">, now: number) {
  return (
    !!save.coffee && now >= save.coffee.startedAt && now < save.coffee.endsAt
  );
}
function coffeeOverlap(save: SaveData, timer: Timer, until: number) {
  if (!save.coffee || timer.kind !== "focus" || timer.status !== "running")
    return 0;
  return Math.max(
    0,
    Math.min(until, timer.endAt ?? until, save.coffee.endsAt) -
      Math.max(timer.startedAt, save.coffee.startedAt),
  );
}
export function rewardsWithCoffee(minutes: number, boostedMs: number): Rewards {
  const base = getRewards(minutes);
  const overlap = Math.max(0, Math.min(minutes * 60000, boostedMs));
  return {
    ...base,
    coins:
      base.coins + Math.floor((base.coins * overlap) / (minutes * 60000) / 4),
  };
}
export function purchaseCoffee(save: SaveData, now: number): SaveData {
  if (
    !time(now) ||
    !time(now + COFFEE_DURATION) ||
    save.timer ||
    coffeeActive(save, now) ||
    save.coins < COFFEE_PRICE
  )
    return save;
  return {
    ...save,
    coins: save.coins - COFFEE_PRICE,
    coffee: { startedAt: now, endsAt: now + COFFEE_DURATION },
  };
}
