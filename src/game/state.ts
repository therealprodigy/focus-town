export type FocusMinutes = 15 | 25 | 45 | 60;
export type BreakMinutes = 3 | 5 | 8 | 10;
export type Rewards = { energy: number; xp: number; coins: number };
export const REWARDS: Record<FocusMinutes, Rewards> = { 15: { energy: 15, xp: 12, coins: 6 }, 25: { energy: 25, xp: 25, coins: 12 }, 45: { energy: 45, xp: 50, coins: 22 }, 60: { energy: 60, xp: 70, coins: 30 } };
export const BREAK_MINUTES: Record<FocusMinutes, BreakMinutes> = { 15: 3, 25: 5, 45: 8, 60: 10 };
export type Timer = { id: string; kind: 'focus' | 'break'; durationMinutes: FocusMinutes | BreakMinutes; status: 'running' | 'paused'; startedAt: number; endAt: number | null; remainingMs: number };
export type CompletedSession = { id: string; minutes: FocusMinutes; completedAt: number; localDate: string };
export type Completion = { id: string; focusMinutes: FocusMinutes; breakMinutes: BreakMinutes; rewards: Rewards };
export type SaveData = { version: 1; coins: number; energy: number; xp: number; sessions: CompletedSession[]; timer: Timer | null; lastCompletion: Completion | null };
export const SAVE_KEY = 'focusraid-save-v1';
export const createSave = (): SaveData => ({ version: 1, coins: 0, energy: 0, xp: 0, sessions: [], timer: null, lastCompletion: null });
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const count = (x: unknown): x is number => Number.isSafeInteger(x) && (x as number) >= 0;
const time = (x: unknown): x is number => count(x) && (x as number) <= 8640000000000000;
const id = (x: unknown): x is string => typeof x === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(x);
const focus = (x: unknown): x is FocusMinutes => [15, 25, 45, 60].includes(x as number);
const rest = (x: unknown): x is BreakMinutes => [3, 5, 8, 10].includes(x as number);
export function localDateKey(timestamp: number) { const d = new Date(timestamp); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-') }
function dateKey(x: unknown): x is string { if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false; const d = new Date(x + 'T00:00:00Z'); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x }
function validTimer(x: unknown): x is Timer {
    if (!record(x) || !id(x.id) || !time(x.startedAt) || !count(x.remainingMs) || x.remainingMs <= 0) return false;
    if (x.kind === 'focus' ? !focus(x.durationMinutes) : x.kind === 'break' ? !rest(x.durationMinutes) : true) return false;
    if (x.remainingMs > (x.durationMinutes as number) * 60000) return false;
    return x.status === 'paused' ? x.kind === 'focus' && x.endAt === null : x.status === 'running' && time(x.endAt) && x.endAt === x.startedAt + x.remainingMs;
}
function validSave(x: unknown): x is SaveData {
    if (!record(x) || x.version !== 1 || !count(x.coins) || !count(x.energy) || !count(x.xp) || !Array.isArray(x.sessions)) return false;
    const ids = new Set<string>();
    for (const s of x.sessions) { if (!record(s) || !id(s.id) || ids.has(s.id) || !focus(s.minutes) || !time(s.completedAt) || !dateKey(s.localDate)) return false; ids.add(s.id) }
    if (x.timer !== null && (!validTimer(x.timer) || ids.has(x.timer.id))) return false;
    if (x.lastCompletion !== null) {
        const c = x.lastCompletion; if (!record(c) || !id(c.id) || !focus(c.focusMinutes) || c.breakMinutes !== BREAK_MINUTES[c.focusMinutes] || !record(c.rewards)) return false;
        const r = REWARDS[c.focusMinutes]; if (c.rewards.energy !== r.energy || c.rewards.xp !== r.xp || c.rewards.coins !== r.coins || !x.sessions.some(s => s.id === c.id && s.minutes === c.focusMinutes)) return false
    }
    return true;
}
export function parseSave(raw: string | null): { save: SaveData; error: string | null } {
    if (raw === null) return { save: createSave(), error: null };
    try { const value: unknown = JSON.parse(raw); if (validSave(value)) return { save: value, error: null }; return { save: createSave(), error: 'This save is from another version or has damaged data. The original has been kept.' } } catch { return { save: createSave(), error: 'This save could not be read. The original has been kept.' } }
}
export const serializeSave = (save: SaveData) => JSON.stringify(save);
export function remainingMs(timer: Timer, now: number) { return timer.status === 'paused' ? timer.remainingMs : Math.max(0, Math.min(timer.remainingMs, (timer.endAt ?? now) - now)) }
export function settleTimer(save: SaveData, now: number): SaveData {
    const t = save.timer; if (!time(now) || !t || t.status !== 'running' || t.endAt === null || now < t.endAt) return save;
    if (t.kind === 'break' || save.sessions.some(s => s.id === t.id)) return { ...save, timer: null };
    const minutes = t.durationMinutes as FocusMinutes, r = REWARDS[minutes];
    if (!count(save.coins + r.coins) || !count(save.energy + r.energy) || !count(save.xp + r.xp)) return { ...save, timer: null };
    return { ...save, timer: null, coins: save.coins + r.coins, energy: save.energy + r.energy, xp: save.xp + r.xp, sessions: [...save.sessions, { id: t.id, minutes, completedAt: t.endAt, localDate: localDateKey(t.endAt) }], lastCompletion: { id: t.id, focusMinutes: minutes, breakMinutes: BREAK_MINUTES[minutes], rewards: { ...r } } };
}
function start(save: SaveData, kind: Timer['kind'], minutes: FocusMinutes | BreakMinutes, now: number, sessionId: string): SaveData {
    const ready = settleTimer(save, now); if (ready.timer || !time(now) || !id(sessionId) || !time(now + minutes * 60000) || ready.sessions.some(s => s.id === sessionId)) return ready;
    return { ...ready, lastCompletion: null, timer: { id: sessionId, kind, durationMinutes: minutes, status: 'running', startedAt: now, endAt: now + minutes * 60000, remainingMs: minutes * 60000 } };
}
export function startFocus(save: SaveData, minutes: FocusMinutes, now: number, sessionId: string) { return focus(minutes) ? start(save, 'focus', minutes, now, sessionId) : save }
export function startBreak(save: SaveData, minutes: BreakMinutes, now: number, sessionId: string) { return rest(minutes) ? start(save, 'break', minutes, now, sessionId) : save }
export function pauseFocus(save: SaveData, now: number): SaveData { const ready = settleTimer(save, now), t = ready.timer; if (!time(now) || !t || t.kind !== 'focus' || t.status !== 'running') return ready; return { ...ready, timer: { ...t, status: 'paused', endAt: null, remainingMs: remainingMs(t, now) } } }
export function resumeFocus(save: SaveData, now: number): SaveData { const t = save.timer; if (!t || t.kind !== 'focus' || t.status !== 'paused' || !time(now) || !time(now + t.remainingMs)) return save; return { ...save, timer: { ...t, status: 'running', startedAt: now, endAt: now + t.remainingMs } } }
export function cancelTimer(save: SaveData, now: number): SaveData { const ready = settleTimer(save, now); return ready.timer ? { ...ready, timer: null } : ready }
export const dismissCompletion = (save: SaveData): SaveData => save.lastCompletion ? { ...save, lastCompletion: null } : save;
export function getProgress(save: SaveData, now: number) {
    const totals = new Map<string, number>(); for (const s of save.sessions) totals.set(s.localDate, (totals.get(s.localDate) ?? 0) + s.minutes);
    const today = localDateKey(now), ordinal = (key: string) => Date.parse(key + 'T00:00:00Z') / 86400000, todayDay = ordinal(today);
    const days = [...totals].filter(([key, mins]) => mins >= 25 && ordinal(key) <= todayDay).map(([key]) => ordinal(key)).sort((a, b) => a - b);
    let run = 0, best = 0, last = -Infinity; for (const day of days) { run = day === last + 1 ? run + 1 : 1; best = Math.max(best, run); last = day }
    return { level: Math.floor(save.xp / 100) + 1, currentStreak: last >= todayDay - 1 ? run : 0, bestStreak: best, todayMinutes: totals.get(today) ?? 0, totalMinutes: save.sessions.reduce((n, s) => n + s.minutes, 0) };
}
