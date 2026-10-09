import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { GameEngine } from './game/engine';
import { getWorldClock } from './game/renderer';
import { type Interaction, type SceneId } from './game/world';
import { SAVE_KEY, createSave, parseSave, serializeSave, settleTimer, startFocus, startBreak, pauseFocus, resumeFocus, cancelTimer, dismissCompletion, remainingMs, getProgress, getRewards, parseMinutes, type SaveData } from './game/state';

type Panel = 'desk' | 'bed' | 'journal' | 'help' | 'cancel' | Interaction | null;
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); return () => ref.current?.close() }, []);
  return <dialog ref={ref} aria-labelledby="dialog-title" onCancel={e => { e.preventDefault(); onClose() }}><div className="dialog-top"><h2 id="dialog-title">{title}</h2><button className="close" aria-label="Close dialog" onClick={onClose}>X</button></div>{children}</dialog>;
}
function useSave() {
  const [save, setSave] = useState<SaveData>(createSave), ref = useRef(save), writer = useRef(false);
  const [ready, setReady] = useState(false), [notice, setNotice] = useState('Opening save...');
  const update = useCallback((change: (s: SaveData) => SaveData) => {
    if (!writer.current) return false;
    const next = change(ref.current); if (next === ref.current) return true;
    try { localStorage.setItem(SAVE_KEY, serializeSave(next)); ref.current = next; setSave(next); setNotice(''); return true }
    catch { setNotice('Could not save. Free some browser storage and try again.'); return false }
  }, []);
  useEffect(() => {
    let alive = true, release: (() => void) | undefined; const controller = new AbortController();
    const load = () => { try { const parsed = parseSave(localStorage.getItem(SAVE_KEY)); ref.current = parsed.save; setSave(parsed.save); setNotice(parsed.error ?? ''); return !parsed.error } catch { setNotice('Browser storage is unavailable. Sessions cannot be saved.'); return false } };
    if (!navigator.locks) { load(); setNotice('This browser cannot protect saves across tabs. Use a current browser for sessions.'); setReady(true); return () => { alive = false } };
    load(); setNotice('Save open in another tab. Close that tab to start sessions here.'); setReady(true);
    void navigator.locks.request('focusraid-save-writer', { signal: controller.signal }, async () => {
      if (!alive) return;
      writer.current = load(); setReady(true);
      await new Promise<void>(resolve => { release = resolve }); writer.current = false;
    }).catch(() => { if (alive && !controller.signal.aborted) { setNotice('Could not open the save. Reload to try again.'); setReady(true) } });
    return () => { alive = false; writer.current = false; controller.abort(); release?.() };
  }, []);
  return { save, update, ready, notice, canSave: writer.current };
}
const clockText = (ms: number) => { const s = Math.ceil(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') };
function readPreferences() {
  const defaults = { focus: '25', short: '5', long: '15', breakChoice: 'short', controls: true };
  try {
    const p = JSON.parse(localStorage.getItem('focus-town-preferences-v1') ?? 'null'); if (!p || typeof p !== 'object') return defaults;
    return { focus: parseMinutes(p.focus) ? String(p.focus) : defaults.focus, short: parseMinutes(p.short) ? String(p.short) : defaults.short, long: parseMinutes(p.long) ? String(p.long) : defaults.long, breakChoice: p.breakChoice === 'long' ? 'long' : 'short', controls: p.controls !== false };
  } catch { return defaults }
}
export default function App() {
  const { save, update, ready, notice, canSave } = useSave();
  const canvas = useRef<HTMLCanvasElement>(null), engine = useRef<GameEngine | null>(null); const [prefs] = useState(readPreferences);
  const [entered, setEntered] = useState(false), [scene, setScene] = useState<SceneId>('village'), [nearby, setNearby] = useState<Interaction>();
  const [panel, setPanel] = useState<Panel>(null), [now, setNow] = useState(Date.now);
  const [focusDraft, setFocusDraft] = useState(prefs.focus), [shortDraft, setShortDraft] = useState(prefs.short), [longDraft, setLongDraft] = useState(prefs.long);
  const [breakChoice, setBreakChoice] = useState(prefs.breakChoice), [controls, setControls] = useState(prefs.controls);
  const [quiet, setQuiet] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const progress = getProgress(save, now), timer = save.timer, completion = canSave ? save.lastCompletion : null, worldClock = getWorldClock(now);
  const focusMinutes = parseMinutes(focusDraft), shortMinutes = parseMinutes(shortDraft), longMinutes = parseMinutes(longDraft);
  const chosenBreak = breakChoice === 'long' ? longMinutes : shortMinutes, rewards = focusMinutes ? getRewards(focusMinutes) : null;
  const close = useCallback(() => { setPanel(null); requestAnimationFrame(() => engine.current?.focus()) }, []);
  useEffect(() => { try { localStorage.setItem('focus-town-preferences-v1', JSON.stringify({ focus: focusDraft, short: shortDraft, long: longDraft, breakChoice, controls })) } catch { /* Preferences are optional; game progress uses the protected save. */ } }, [focusDraft, shortDraft, longDraft, breakChoice, controls]);
  useEffect(() => { if (!canvas.current) return; const game = new GameEngine(canvas.current, { onInteract: i => setPanel(i.kind === 'desk' ? 'desk' : i.kind === 'bed' ? 'bed' : i), onNearby: setNearby, onScene: setScene }); engine.current = game; return () => { game.destroy(); engine.current = null } }, []);
  useEffect(() => { const tick = () => { const t = Date.now(); setNow(t); update(s => settleTimer(s, t)) }; tick(); const id = window.setInterval(tick, 250); document.addEventListener('visibilitychange', tick); return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) } }, [update, ready]);
  useEffect(() => { if (engine.current) { engine.current.blocked = !entered || !!panel || !!completion; engine.current.streak = progress.currentStreak; engine.current.reducedMotion = quiet; engine.current.paused = timer?.status === 'paused' } }, [entered, panel, completion, progress.currentStreak, quiet, timer?.status]);
  useEffect(() => { if (!controls) for (const key of ['w', 'a', 's', 'd']) engine.current?.key(key, false) }, [controls]);
 const restored = useRef(false);
  useEffect(() => { if (!ready) return; engine.current?.setSession(timer?.kind ?? null, !restored.current); restored.current = true }, [timer?.kind, ready]);
  useEffect(() => { document.title = timer ? clockText(remainingMs(timer, now)) + ' | Focus Town' : 'Focus Town'; return () => { document.title = 'Focus Town' } }, [timer, now]);
  const begin = () => { if (focusMinutes && chosenBreak && update(s => startFocus(s, focusMinutes, Date.now(), crypto.randomUUID(), chosenBreak))) close() };
  const rest = (minutes: number | null) => { if (minutes && update(s => startBreak(s, minutes, Date.now(), crypto.randomUUID()))) close() };
  const changeTimer = () => update(s => timer?.status === 'paused' ? resumeFocus(s, Date.now()) : pauseFocus(s, Date.now()));
  const finish = () => { update(dismissCompletion); close() };
  const startGame = () => { setEntered(true); engine.current?.focus() };
  const showMenu = (next: Panel) => { if (!entered) setEntered(true); setPanel(next) };
  const minutesInput = (label: string, value: string, change: (v: string) => void) => <label className="minutes-field"><span>{label}</span><span><input type="number" min="1" max="720" step="1" inputMode="numeric" value={value} onChange={e => change(e.target.value)} aria-label={label + ' minutes'} /><span className="unit">min</span></span></label>;
  return <main className="shell">
    <header className="masthead"><button className="brand" onClick={() => showMenu('help')}>FOCUS TOWN</button><nav aria-label="Game menus"><button disabled={!!timer} onClick={() => showMenu('desk')}>Focus</button><button disabled={!!timer} onClick={() => showMenu('bed')}>Break</button><button onClick={() => showMenu('journal')}>Journal</button><button aria-pressed={controls} onClick={() => setControls(v => !v)}>Controls</button></nav></header>
    <section className="game-frame" aria-label="Greenvale game">
      <div className="hud"><span className="location">{scene === 'house' ? 'Lantern House' : 'Greenvale'}<small>{worldClock.label} {String(worldClock.hour).padStart(2, '0')}:{String(worldClock.minute).padStart(2, '0')}</small></span><div className="purse" aria-label="Saved progress"><span>LV {progress.level}</span><span>{save.coins} coins</span><span>{save.energy} energy</span></div></div>
      <canvas ref={canvas} width={960} height={600} tabIndex={0} aria-label={scene === 'village' ? 'Greenvale village. WASD or arrows to walk; E to interact.' : 'Lantern House. Desk northwest; bed northeast. E to interact.'} aria-describedby="world-hint" onPointerDown={() => engine.current?.focus()}>Walk with WASD or arrows. Press E to interact.</canvas>
      {!entered && <div className="start-screen"><h1>FOCUS<br />TOWN</h1><button className="primary" disabled={!ready} onClick={startGame}>{ready ? 'Enter town' : 'Loading...'}</button></div>}
      {entered && !timer && !completion && !panel && nearby && <div className="interaction-bar" aria-live="polite"><button onClick={() => engine.current?.interact()}><kbd>E</kbd> {nearby.label}</button></div>}
      {entered && timer && <aside className="timer-dock" aria-label={timer.kind === 'focus' ? 'Focus session' : 'Break'}><div><span className="timer-label">{timer.kind === 'break' ? 'Break' : timer.status === 'paused' ? 'Paused' : 'Focus'}</span><strong className="clock" role="timer" aria-label="Time remaining">{clockText(remainingMs(timer, now))}</strong></div><div className="timer-actions">{timer.kind === 'focus' && <button disabled={!canSave} onClick={changeTimer}>{timer.status === 'paused' ? 'Resume' : 'Pause'}</button>}<button disabled={!canSave} onClick={() => setPanel('cancel')}>{timer.kind === 'break' ? 'Skip break' : 'End'}</button></div></aside>}
    </section>
    <div className="status-line"><button onClick={() => showMenu('journal')}>{progress.currentStreak} day streak <span className="muted">/ best {progress.bestStreak}</span></button><span>{progress.todayMinutes}/{progress.dailyGoalMinutes} min today</span><progress max={progress.dailyGoalMinutes} value={Math.min(progress.todayMinutes, progress.dailyGoalMinutes)} aria-label="Today's focus goal" /><button className="motion-toggle" aria-pressed={!quiet} onClick={() => setQuiet(v => !v)}>Motion {quiet ? 'off' : 'on'}</button></div>
    <p id="world-hint" className="sr-only">WASD or arrow keys to walk. E to interact. Escape closes menus. Lantern House is northwest of the fountain. Inside, the desk is northwest and the bed northeast.</p>
    {controls && <footer className="controls-helper"><p><kbd>WASD</kbd> walk <kbd>E</kbd> interact <kbd>Esc</kbd> close<span className="route-hint">{scene === 'village' ? 'House: northwest of the fountain.' : 'Desk: top left. Bed: top right.'}</span></p><button aria-label="Dismiss controls" onClick={() => { setControls(false); engine.current?.focus() }}>Hide X</button></footer>}
    {entered && controls && <div className="touch-controls" aria-label="Movement controls">{[['w', '^', 'Walk up'], ['a', '<', 'Walk left'], ['s', 'v', 'Walk down'], ['d', '>', 'Walk right']].map(([key, label, name]) => <button key={key} aria-label={name} disabled={!!timer || !!panel || !!completion} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); engine.current?.key(key, true) }} onPointerUp={() => engine.current?.key(key, false)} onPointerCancel={() => engine.current?.key(key, false)} onLostPointerCapture={() => engine.current?.key(key, false)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); engine.current?.key(key, true) } }} onKeyUp={() => engine.current?.key(key, false)} onBlur={() => engine.current?.key(key, false)}>{label}</button>)}</div>}
    {notice && <p className="save-notice" role="status">{notice}</p>}
    {panel === 'desk' && <Modal title="Focus" onClose={close}><div className="duration-presets">{[15, 25, 45, 60].map(m => <button key={m} aria-pressed={focusMinutes === m} onClick={() => setFocusDraft(String(m))}>{m}m</button>)}</div>{minutesInput('Focus', focusDraft, setFocusDraft)}<div className="break-choices"><button aria-pressed={breakChoice === 'short'} onClick={() => setBreakChoice('short')}>Short break</button><button aria-pressed={breakChoice === 'long'} onClick={() => setBreakChoice('long')}>Long break</button></div>{minutesInput(breakChoice === 'long' ? 'Long break' : 'Short break', breakChoice === 'long' ? longDraft : shortDraft, breakChoice === 'long' ? setLongDraft : setShortDraft)}{(!focusMinutes || !chosenBreak) && <p className="input-error" role="alert">Enter whole minutes from 1 to 720.</p>}{rewards && <p className="reward-note">+{rewards.energy} energy / +{rewards.xp} XP / +{rewards.coins} coins</p>}<button className="primary wide" disabled={!canSave || !!timer || !focusMinutes || !chosenBreak} onClick={begin}>Start focus</button></Modal>}
    {panel === 'bed' && <Modal title="Break" onClose={close}>{minutesInput('Short break', shortDraft, setShortDraft)}{minutesInput('Long break', longDraft, setLongDraft)}{(!shortMinutes || !longMinutes) && <p className="input-error" role="alert">Enter whole minutes from 1 to 720.</p>}<div className="button-row"><button disabled={!canSave || !!timer || !shortMinutes} onClick={() => rest(shortMinutes)}>Short break</button><button className="primary" disabled={!canSave || !!timer || !longMinutes} onClick={() => rest(longMinutes)}>Long break</button></div></Modal>}
    {panel === 'cancel' && <Modal title={timer?.kind === 'break' ? 'Skip this break?' : 'End this session?'} onClose={close}><p>{timer?.kind === 'break' ? 'Your focus rewards are already saved.' : 'An unfinished session earns no rewards. Pause to keep your place.'}</p><div className="button-row"><button onClick={close}>Keep going</button><button className="primary" onClick={() => { update(s => cancelTimer(s, Date.now())); close() }}>{timer?.kind === 'break' ? 'Skip break' : 'End session'}</button></div></Modal>}
    {panel === 'journal' && <Modal title="Journal" onClose={close}><div className="journal-summary"><span><b>{progress.currentStreak}</b> current streak</span><span><b>{progress.bestStreak}</b> best streak</span><span><b>{progress.totalMinutes}</b> total minutes</span></div><h3>This week</h3><div className="week-activity" aria-label="Last seven days of focus">{progress.weekActivity.map(day => <div key={day.date} className={(day.goalMet ? 'goal-met ' : '') + (day.isToday ? 'today' : '')} aria-label={day.date + ': ' + day.minutes + ' minutes'}><span className="day-minutes">{day.minutes}</span><div className="day-bar" style={{ height: Math.max(2, Math.min(56, day.minutes / progress.dailyGoalMinutes * 56)) }} /><span>{new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })}</span></div>)}</div><p className="fine-print">{progress.dailyGoalMinutes} completed minutes earns a streak day. Today stays open until midnight.</p><h3>Recent sessions</h3>{save.sessions.length ? <ul className="session-list">{save.sessions.slice(-7).reverse().map(s => <li key={s.id}><span>{s.localDate}</span><b>{s.minutes} min</b></li>)}</ul> : <p>No completed sessions yet.</p>}<p className="fine-print">Saved in this browser.</p></Modal>}
    {panel === 'help' && <Modal title="Controls" onClose={close}><p><kbd>WASD</kbd> or arrows: walk<br /><kbd>E</kbd>: interact<br /><kbd>Esc</kbd>: close</p><p>Lantern House is northwest of the fountain. The desk starts focus sessions; the bed starts breaks. You can also use the top menu.</p><button onClick={() => setControls(v => !v)}>{controls ? 'Hide helper' : 'Show helper'}</button><pre className="ascii" aria-hidden="true">{'  .--.\n  |::|\n _|__|_\n   ||'}</pre></Modal>}
    {panel && typeof panel === 'object' && <Modal title={panel.title ?? panel.label} onClose={close}>{panel.lines?.map((line, i) => <p key={i}>{line}</p>)}<button className="primary" onClick={close}>Close</button></Modal>}
    {entered && completion && !panel && <Modal title="Session complete" onClose={finish}><p>{completion.focusMinutes} minutes finished.</p><p className="reward-note">+{completion.rewards.energy} energy / +{completion.rewards.xp} XP / +{completion.rewards.coins} coins</p><div className="button-row"><button onClick={finish}>Continue</button><button className="primary" disabled={!canSave} onClick={() => rest(completion.breakMinutes)}>Break {completion.breakMinutes}m</button></div><button className="text-button" onClick={() => setPanel('bed')}>Choose another break</button></Modal>}
  </main>;
}
