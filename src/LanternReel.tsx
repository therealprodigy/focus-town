import { useState } from "react";
import { Button } from "./components/ui/button";
import { POCKET_FILMS } from "./game/discoveries";

export function LanternReel() {
  const [frame, setFrame] = useState<number | null>(null);
  const [film, setFilm] = useState(1);
  if (frame === null)
    return (
      <Button onClick={() => setFrame(0)}>Show Pip’s restored reel</Button>
    );
  return (
    <section className="lantern-reel" aria-label="Pip’s lantern film">
      <label className="setting-row">
        Now showing
        <select
          value={film}
          onChange={(e) => {
            setFilm(Number(e.target.value));
            setFrame(0);
          }}
        >
          {POCKET_FILMS.map((item, i) => (
            <option key={item.title} value={i}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <svg viewBox="0 0 360 180" aria-hidden="true" shapeRendering="crispEdges">
        <rect
          width="360"
          height="180"
          fill={
            film === 1 && frame < 2
              ? frame === 0
                ? "#ba8a70"
                : "#8db4b4"
              : "#223947"
          }
        />
        {(film !== 1 || frame === 2) && (
          <path
            d="M20 24h3v3h-3zM70 13h2v2h-2zM153 26h3v3h-3zM233 18h2v2h-2zM324 37h3v3h-3z"
            fill="#d9d5ac"
          />
        )}
        <rect
          x={273 - frame * 30}
          y="26"
          width="24"
          height="24"
          fill="#edddb0"
        />
        <path
          d="M0 104h30V84h44v13h33V71h61v20h38V78h46v17h47V77h61v103H0z"
          fill="#3d5958"
        />
        <path d="M0 127h360v53H0z" fill="#718367" />
        {film === 1 && (
          <>
            <path
              d="M42 72h5v65h-5zM42 72h90v8H42zM117 80h5v58h-5z"
              fill="#ad8f63"
            />
            <path d="M39 66h94v7H39z" fill="#96744b" />
            <path d="M165 132h45v8h-45zM207 126h17v4h-17z" fill="#b09467" />
            <path d="M168 140h7v7h-7zM202 140h7v7h-7z" fill="#293a3b" />
            {frame === 2 && (
              <>
                <path d="M200 115h8v11h-8z" fill="#f6d590" />
                <path
                  d="M235 116h115v32H235zM239 110h104v6H239z"
                  fill="#496c69"
                />
                <path
                  d="M243 123h13v10h-13zM265 123h13v10h-13zM287 123h13v10h-13zM309 123h13v10h-13z"
                  fill="#f1cc7d"
                />
              </>
            )}
          </>
        )}
        {film === 0 && (
          <>
            {[0, 1, 2, 3].map((n) => (
              <g key={n}>
                <rect
                  x={226 + n * 9}
                  y={126 - n * 19}
                  width={92 - n * 16}
                  height="18"
                  fill={n % 2 ? "#a17150" : "#6d8179"}
                />
                <rect
                  x={230 + n * 9}
                  y={131 - n * 19}
                  width={82 - n * 16}
                  height="7"
                  fill="#d5c5a2"
                />
              </g>
            ))}
            <path
              d="M65 123h25v20H65zM69 116h17v7H69zM89 125h12v5H89zM68 143h19v3H68z"
              fill="#dab06c"
            />
            {frame === 2 && (
              <path d="M74 102h3v7h-3zM78 94h3v7h-3z" fill="#ecdec3" />
            )}
          </>
        )}
        {film === 2 && (
          <>
            <path d="M258 71h14v74h-14z" fill="#917354" />
            <path
              d="M228 49h72v23h-72zM212 71h105v28H212zM229 99h70v17h-70z"
              fill="#819564"
            />
            <path d="M238 63h10v9h-10zM283 87h10v9h-10z" fill="#bd6651" />
            <rect
              x="231"
              y={frame === 0 ? 91 : frame === 1 ? 112 : 140}
              width="10"
              height="9"
              fill="#bd6651"
            />
            <path
              d="M149 111h3v29h-3zM141 108h19v3h-19zM141 103h2v5h-2zM149 103h2v5h-2zM158 103h2v5h-2z"
              fill="#c6ad77"
            />
          </>
        )}
        <path d="M166 96h10v10h-10z" fill="#cda47c" />
        <path d="M163 106h16v23h-16z" fill="#d2b164" />
        <path d="M165 129h5v7h-5zM173 129h5v7h-5z" fill="#263d41" />
        <path
          d="M188 125h12v8h-12zM188 121h3v5h-3zM197 121h3v5h-3zM200 127h7v3h-7z"
          fill="#dac8b0"
        />
      </svg>
      <div aria-live="polite">
        <h3>{POCKET_FILMS[film].title}</h3>
        <p>{POCKET_FILMS[film].frames[frame]}</p>
      </div>
      <div className="button-row">
        <Button disabled={frame === 0} onClick={() => setFrame(frame - 1)}>
          Previous
        </Button>
        <span>{frame + 1} / 3</span>
        <Button onClick={() => setFrame(frame === 2 ? null : frame + 1)}>
          {frame === 2 ? "Roll credits" : "Next frame"}
        </Button>
      </div>
    </section>
  );
}
