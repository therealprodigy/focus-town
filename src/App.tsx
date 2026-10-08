import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { GameEngine } from './game/engine';
import { type Interaction, type SceneId } from './game/world';
import { SAVE_KEY, REWARDS, BREAK_MINUTES, createSave, parseSave, serializeSave, settleTimer, startFocus, startBreak, pauseFocus, resumeFocus, cancelTimer, dismissCompletion, remainingMs, getProgress, type SaveData, type FocusMinutes, type BreakMinutes } from './game/state';

type Panel = 'desk' | 'bed' | 'journal' | 'help' | 'cancel' | Interaction | null;
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); return () => ref.current?.close() }, []);
  return <dialog ref={ref} aria-labelledby="dialog-title" onCancel={e => { e.preventDefault(); onClose() }}><div className="dialog-top"><span className="eyebrow">THE GREENVALE PAPERS</span><button className="close" aria-label="Close dialog" onClick={onClose}>×</button></div><h2 id="dialog-title">{title}</h2>{children}</dialog>;
}
function useSave() {
  const [save, setSave] = useState<SaveData>(createSave), ref = useRef(save), writer = useRef(false);
  const [ready, setReady] = useState(false), [notice, setNotice] = useState('Opening your notebook…');
  const update = useCallback((change: (s: SaveData) => SaveData) => {
    if (!writer.current) return false;
    const next = change(ref.current); if (next === ref.current) return true;
    try { localStorage.setItem(SAVE_KEY, serializeSave(next)); ref.current = next; setSave(next); setNotice(''); return true }
    catch { setNotice('Your browser could not save this change. Keep this tab open and free some storage, then try again.'); return false }
  }, []);
  useEffect(() => {
    let alive = true, release: (() => void) | undefined; const controller = new AbortController();
    const load = () => { try { const parsed = parseSave(localStorage.getItem(SAVE_KEY)); ref.current = parsed.save; setSave(parsed.save); setNotice(parsed.error ?? ''); return !parsed.error } catch { setNotice('Browser storage is unavailable. You can explore, but focus sessions need a place to save.'); return false } };
    if (!navigator.locks) { load(); setNotice('This browser cannot protect saves across tabs. Explore here, or use a current browser to start a session.'); setReady(true); return () => { alive = false } };
    load(); setNotice('Waiting for your notebook. If another tab is open, close it to continue here.'); setReady(true);
    void navigator.locks.request('focusraid-save-writer', { signal: controller.signal }, async () => {
      if (!alive) return;
      writer.current = load(); setReady(true);
      await new Promise<void>(resolve => { release = resolve }); writer.current = false;
    }).catch(() => { if (alive && !controller.signal.aborted) { setNotice('Your browser could not open the save lock. Reload to try again.'); setReady(true) } });
    return () => { alive = false; writer.current = false; controller.abort(); release?.() };
  }, []);
  return { save, update, ready, notice, canSave: writer.current };
}
const clockText = (ms: number) => { const s = Math.ceil(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') };
export default function App() {
  const { save, update, ready, notice, canSave } = useSave();
  const canvas = useRef<HTMLCanvasElement>(null), engine = useRef<GameEngine | null>(null);
  const [entered, setEntered] = useState(false), [scene, setScene] = useState<SceneId>('village'), [nearby, setNearby] = useState<Interaction>();
  const [panel, setPanel] = useState<Panel>(null), [now, setNow] = useState(Date.now), [duration, setDuration] = useState<FocusMinutes>(25);
  const [quiet, setQuiet] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const progress = getProgress(save, now), timer = save.timer, completion = canSave ? save.lastCompletion : null;
  const close = useCallback(() => { setPanel(null); requestAnimationFrame(() => engine.current?.focus()) }, []);
  useEffect(() => { if (!canvas.current) return; const game = new GameEngine(canvas.current, { onInteract: i => setPanel(i.kind === 'desk' ? 'desk' : i.kind === 'bed' ? 'bed' : i), onNearby: setNearby, onScene: setScene }); engine.current = game; return () => { game.destroy(); engine.current = null } }, []);
  useEffect(() => { const tick = () => { const t = Date.now(); setNow(t); update(s => settleTimer(s, t)) }; tick(); const id = window.setInterval(tick, 250); document.addEventListener('visibilitychange', tick); return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) } }, [update, ready]);
  useEffect(() => { if (engine.current) { engine.current.blocked = !entered || !!panel || !!completion; engine.current.streak = progress.currentStreak; engine.current.reducedMotion = quiet; engine.current.paused = timer?.status === 'paused' } }, [entered, panel, completion, progress.currentStreak, quiet, timer?.status]);
  const restored = useRef(false);
  useEffect(() => { if (!ready) return; engine.current?.setSession(timer?.kind ?? null, !restored.current); restored.current = true }, [timer?.kind, ready]);
  useEffect(() => { document.title = timer ? clockText(remainingMs(timer, now)) + ' · FocusRaid' : 'FocusRaid · a little focus, a little magic'; return () => { document.title = 'FocusRaid' } }, [timer, now]);
  const begin = (minutes: FocusMinutes) => { if (update(s => startFocus(s, minutes, Date.now(), crypto.randomUUID()))) { close(); engine.current?.focus() } };
  const rest = (minutes: BreakMinutes) => { if (update(s => startBreak(s, minutes, Date.now(), crypto.randomUUID()))) close() };
  const changeTimer = () => update(s => timer?.status === 'paused' ? resumeFocus(s, Date.now()) : pauseFocus(s, Date.now()));
  const finish = () => { update(dismissCompletion); close() };
  const startGame = () => { setEntered(true); engine.current?.focus() };
  const hint = scene === 'village' ? 'Lantern House is northwest of the fountain. Your desk is waiting.' : 'The desk is at the top left. The bed is across the rug.';
  return <main className="shell">
    <header className="masthead"><a className="brand" href="#" onClick={e => { e.preventDefault(); setPanel('help') }} aria-label="FocusRaid field guide"><span className="brand-sigil" aria-hidden="true">[f:r]</span><span>FOCUSRAID<small>A LITTLE FOCUS. A LITTLE MAGIC.</small></span></a><span className="build-tag">GREENVALE / CHAPTER 01</span><nav aria-label="Game menus"><button onClick={() => setPanel('journal')}>Notebook</button><button className="icon-button" aria-label="Open field guide" onClick={() => setPanel('help')}>?</button></nav></header>
    <section className="game-frame" aria-label="Greenvale game">
      <div className="hud"><div className="location"><span className="eyebrow">{scene === 'house' ? 'YOUR CORNER OF THE WORLD' : 'THE LANTERNS ARE STILL LIT'}</span><h1>{scene === 'house' ? 'Lantern House' : 'Greenvale'}</h1></div><div className="purse" aria-label="Saved progress"><span><b>{save.energy}</b> energy</span><span><b>{save.coins}</b> coins</span><span><b>{progress.currentStreak}</b> day streak</span></div></div>
      <canvas ref={canvas} width={960} height={600} tabIndex={0} aria-label={scene === 'village' ? 'Greenvale village. Use WASD or arrow keys to walk and E to interact.' : 'Lantern House. Walk northwest to the desk or northeast to the bed. Press E nearby.'} aria-describedby="world-hint" onPointerDown={() => engine.current?.focus()}>Explore Greenvale using the keyboard. The field guide describes the village and its rooms.</canvas>
      {!entered && <div className="start-screen"><span className="eyebrow">A FIELD NOTE FROM GREENVALE</span><h2>Leave a little<br />light on.</h2><p>A quiet village. An unfinished spell.<br />One thing you meant to get done.</p><button className="primary" disabled={!ready} onClick={startGame}>{ready ? 'Enter Greenvale' : 'Opening the gate…'} <span aria-hidden="true">→</span></button><small>Walk home. Sit at your desk. Start small.</small></div>}
      {entered && !timer && !completion && !panel && <div className="interaction-bar" aria-live="polite">{nearby ? <button onClick={() => engine.current?.interact()}><kbd>E</kbd>{nearby.label}</button> : <span>{hint}</span>}</div>}
      {entered && timer && <aside className="timer-card" aria-label={timer.kind === 'focus' ? 'Focus session' : 'Sleep break'}><span className="eyebrow">{timer.kind === 'break' ? 'LET THE CANDLE REST' : timer.status === 'paused' ? 'YOUR PLACE IS SAVED' : 'ONE PAGE AT A TIME'}</span><p className="clock" role="timer" aria-label="Time remaining">{clockText(remainingMs(timer, now))}</p><p>{timer.kind === 'break' ? 'Rest a little. Greenvale can wait.' : timer.status === 'paused' ? 'Paused. Come back when you are ready.' : 'Your apprentice is studying with you.'}</p><div className="timer-actions">{timer.kind === 'focus' && <button disabled={!canSave} onClick={changeTimer}>{timer.status === 'paused' ? 'Resume' : 'Pause'}</button>}<button disabled={!canSave} onClick={() => setPanel('cancel')}>{timer.kind === 'break' ? 'Wake up' : 'End session'}</button></div></aside>}
      <div className="scene-caption" aria-hidden="true">{scene === 'house' ? 'LANTERN HOUSE · SOMEWHERE TO BEGIN' : 'GREENVALE · EAST OF THE OLD WOODS'}</div>
    </section>
    <footer className="game-footer"><p id="world-hint"><kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd> walk <span>·</span> <kbd>E</kbd> interact <span>·</span> <kbd>Esc</kbd> close</p><button className="quiet-toggle" aria-pressed={quiet} onClick={() => setQuiet(v => !v)}>Ambient motion: {quiet ? 'off' : 'on'}</button></footer>
    {entered && <div className="touch-controls" aria-label="Movement controls">{[['w', '↑', 'Walk up'], ['a', '←', 'Walk left'], ['s', '↓', 'Walk down'], ['d', '→', 'Walk right']].map(([key, label, name]) => <button key={key} aria-label={name} disabled={!!timer || !!panel || !!completion} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); engine.current?.key(key, true) }} onPointerUp={() => engine.current?.key(key, false)} onPointerCancel={() => engine.current?.key(key, false)} onLostPointerCapture={() => engine.current?.key(key, false)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); engine.current?.key(key, true) } }} onKeyUp={() => engine.current?.key(key, false)} onBlur={() => engine.current?.key(key, false)}>{label}</button>)}</div>}
    {notice && <p className="save-notice" role="status">{notice}</p>}
    <div className="lower-note"><span>LV. {progress.level} · LANTERN APPRENTICE</span><span>{progress.todayMinutes} minutes today <span className="muted">/ 25 to tend the keeper flame</span></span><span>{canSave && !notice ? 'Saved in this browser' : 'Save unavailable'}</span></div>
    {panel === 'desk' && <Modal title="What needs your attention?" onClose={close}><p>The kettle is warm. Pick a stretch of time, then put this window aside and do your thing.</p><div className="duration-grid">{([15, 25, 45, 60] as const).map(m => <button key={m} className={duration === m ? 'chosen' : ''} aria-pressed={duration === m} onClick={() => setDuration(m)}><b>{m}</b><span>minutes</span></button>)}</div><div className="reward-note"><span>+{REWARDS[duration].energy} energy</span><span>+{REWARDS[duration].xp} XP</span><span>+{REWARDS[duration].coins} coins</span></div><p className="fine-print">Finish the session to collect these. A {BREAK_MINUTES[duration]} minute rest follows if you want one.</p><button className="primary wide" disabled={!canSave || !!timer} onClick={() => begin(duration)}>Settle in for {duration} minutes</button></Modal>}
    {panel === 'bed' && <Modal title="Even apprentices need sleep." onClose={close}><p>No coins to earn here. Just a short rest and a softer pillow.</p><div className="duration-grid">{([3, 5, 8, 10] as const).map(m => <button key={m} disabled={!canSave || !!timer} onClick={() => rest(m)}><b>{m}</b><span>minute rest</span></button>)}</div></Modal>}
    {panel === 'cancel' && <Modal title={timer?.kind === 'break' ? 'Ready to get up?' : 'Put the book down?'} onClose={close}><p>{timer?.kind === 'break' ? 'You can leave the rest early. Your focus rewards stay yours.' : 'An unfinished session earns no rewards. You can pause instead if you only need a moment.'}</p><div className="button-row"><button onClick={close}>Keep going</button><button className="primary" onClick={() => { update(s => cancelTimer(s, Date.now())); close() }}>{timer?.kind === 'break' ? 'Wake up' : 'End without rewards'}</button></div></Modal>}
    {panel === 'journal' && <Modal title="The apprentice’s notebook" onClose={close}><p className="notebook-line">{progress.totalMinutes} minutes given to the things that matter.</p><div className="journal-stats"><span><b>{save.sessions.length}</b> finished sessions</span><span><b>{progress.bestStreak}</b> best streak</span><span><b>{save.xp}</b> total XP</span></div><h3>Recent sessions</h3>{save.sessions.length ? <ul className="session-list">{save.sessions.slice(-5).reverse().map(s => <li key={s.id}><span>{s.localDate}</span><b>{s.minutes} minutes</b></li>)}</ul> : <p className="hand-note">Blank pages are allowed. The first entry starts at your desk.</p>}<p className="fine-print">The keeper flame counts days with at least 25 completed minutes. Progress lives in this browser; clearing its data clears your notebook.</p></Modal>}
    {panel === 'help' && <Modal title="A small field guide" onClose={close}><p>You are Greenvale’s newest lantern apprentice. Your first job is simple: find a little time for something you care about.</p><ol className="guide"><li>Walk northwest from the fountain to Lantern House.</li><li>Stand near its door and press E to go inside.</li><li>Find the desk at the top left. Press E and choose a session.</li><li>Work while your apprentice studies. Return for your rewards and a rest.</li></ol><p>Rowan and Mira are out in the village. The shop, library and forest have notes to read, but their next chapters are still being built.</p><pre className="ascii" aria-label="Small lantern">{"  .--.\n  |::|\n _|__|_\n   ||"}</pre><p className="fine-print">There is no penalty for a missed day. Start again when you can.</p></Modal>}
    {panel && typeof panel === 'object' && <Modal title={panel.title ?? panel.label} onClose={close}>{panel.lines?.map((line, i) => <p key={i}>{line}</p>)}<button className="primary" onClick={close}>Back to the path</button></Modal>}
    {entered && completion && !panel && <Modal title="A little further than before." onClose={finish}><p>{completion.focusMinutes} minutes, finished. Your apprentice closes the book with a leaf between the pages.</p><div className="reward-note"><span>+{completion.rewards.energy} energy</span><span>+{completion.rewards.xp} XP</span><span>+{completion.rewards.coins} coins</span></div><p>Your rewards are saved. The bed is made if you need it.</p><div className="button-row"><button onClick={finish}>Stretch my legs</button><button className="primary" disabled={!canSave} onClick={() => rest(completion.breakMinutes)}>Rest for {completion.breakMinutes} minutes</button></div></Modal>}
  </main>;
}
