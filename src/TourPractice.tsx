import { useState } from "react";
export type PracticeState = {
  x: number;
  y: number;
  moved: boolean;
  read: boolean;
};
export const practiceStart: PracticeState = {
  x: 1,
  y: 3,
  moved: false,
  read: false,
};
export function nearPracticeSign(s: PracticeState) {
  return Math.abs(s.x - 6) + Math.abs(s.y - 1) <= 1;
}
export function practiceAction(s: PracticeState, key: string): PracticeState {
  const moves: Record<string, [number, number]> = {
    w: [0, -1],
    arrowup: [0, -1],
    s: [0, 1],
    arrowdown: [0, 1],
    a: [-1, 0],
    arrowleft: [-1, 0],
    d: [1, 0],
    arrowright: [1, 0],
  };
  const k = key.toLowerCase();
  if (k === "e") return nearPracticeSign(s) ? { ...s, read: true } : s;
  const move = moves[k];
  if (!move) return s;
  const x = Math.max(0, Math.min(7, s.x + move[0])),
    y = Math.max(0, Math.min(4, s.y + move[1]));
  if ((x === 3 && y === 2) || (x === 6 && y === 1) || (x === s.x && y === s.y))
    return s;
  return { ...s, x, y, moved: true };
}
export function TourPractice() {
  const [state, setState] = useState(practiceStart);
  const act = (key: string) => setState((s) => practiceAction(s, key));
  return (
    <div className="tour-practice">
      <div
        className="practice-map"
        tabIndex={0}
        role="group"
        aria-label="Practice yard. Use WASD or arrows to reach the sign in the upper right. Press E to read it."
        onKeyDown={(e) => {
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          if (
            [
              "w",
              "a",
              "s",
              "d",
              "arrowup",
              "arrowleft",
              "arrowdown",
              "arrowright",
              "e",
            ].includes(e.key.toLowerCase())
          ) {
            e.preventDefault();
            e.stopPropagation();
            act(e.key);
          }
        }}
      >
        <svg
          viewBox="0 0 256 160"
          aria-hidden="true"
          shapeRendering="crispEdges"
        >
          <rect width="256" height="160" fill="#a7b37b" />
          <path d="M0 108h256v32H0zM160 32h32v100h-32z" fill="#d4bc8f" />
          {[14, 55, 96, 214].map((x) => (
            <path key={x} d={"M" + x + " 22h4v-6h4v10h-8z"} fill="#6b874e" />
          ))}
          <path d="M100 70h24v20h-24z" fill="#8c8269" />
          <path d="M104 66h16v6h-16z" fill="#c9bba0" />
          <path d="M206 44h4v20h-4z" fill="#785134" />
          <path d="M194 34h28v18h-28z" fill="#b3844d" />
          <path d="M198 39h20v3h-20zM198 45h12v2h-12z" fill="#f5e7bf" />
          <g
            transform={
              "translate(" + (state.x * 32 + 6) + " " + (state.y * 32 + 2) + ")"
            }
          >
            <path d="M4 12h12v12H4z" fill="#9d573d" />
            <path d="M6 24h4v5H6zM12 24h4v5h-4z" fill="#4b4336" />
            <path d="M6 5h10v9H6z" fill="#dcb27e" />
            <path d="M2 6h18v3H2zM7 0h8v6H7z" fill="#584532" />
            <path d="M9 9h2v2H9zM14 9h2v2h-2z" fill="#423a30" />
          </g>
        </svg>
      </div>
      <p className="practice-status" role="status">
        {state.read
          ? "Sign read: Welcome! Please do not feed the deadlines."
          : nearPracticeSign(state)
            ? "You’re beside the sign. Press E or Use."
            : state.moved
              ? "Head to the sign in the upper right. Walk around the stone."
              : "Click the yard, then try the arrow keys. Or use the buttons below."}
      </p>
      <div className="practice-buttons">
        <button aria-label="Walk left" onClick={() => act("a")}>
          ←
        </button>
        <button aria-label="Walk up" onClick={() => act("w")}>
          ↑
        </button>
        <button aria-label="Walk down" onClick={() => act("s")}>
          ↓
        </button>
        <button aria-label="Walk right" onClick={() => act("d")}>
          →
        </button>
        <button disabled={!nearPracticeSign(state)} onClick={() => act("e")}>
          Use
        </button>
        <button onClick={() => setState(practiceStart)}>Reset</button>
      </div>
      <small>Practice only. Your town, timer and coins stay as they are.</small>
    </div>
  );
}
