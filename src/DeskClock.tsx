import { useEffect, useRef, useState } from "react";

export function DeskClock({
  value,
  label,
  plain = false,
}: {
  value: string;
  label: string;
  plain?: boolean;
}) {
  return (
    <div
      className={plain ? "desk-clock plain-clock" : "desk-clock"}
      role="timer"
      aria-label={label + " " + value}
    >
      <span className="clock-digits" aria-hidden="true">
        {[...value].map((digit, index) =>
          digit === ":" ? (
            <span className="clock-colon" key={index}>
              :
            </span>
          ) : (
            <FlipDigit key={index} digit={digit} />
          ),
        )}
      </span>
      {!plain && (
        <span className="clock-maker" aria-hidden="true">
          GREENVALE CLOCKWORKS
        </span>
      )}
    </div>
  );
}
function FlipDigit({ digit }: { digit: string }) {
  const last = useRef(digit);
  const [previous, setPrevious] = useState(digit);
  const [turning, setTurning] = useState(false);
  useEffect(() => {
    if (digit === last.current) return;
    setPrevious(last.current);
    last.current = digit;
    setTurning(true);
    const timeout = window.setTimeout(() => setTurning(false), 380);
    return () => window.clearTimeout(timeout);
  }, [digit]);
  return (
    <span className="clock-digit">
      <span className="digit-face">{digit}</span>
      {turning && (
        <span className="digit-turn" key={digit}>
          <span>{previous}</span>
        </span>
      )}
      <i className="digit-seam" />
    </span>
  );
}
export const TOUR_STEPS = [
  {
    title: "A key to Greenvale",
    art: "key",
    body: "This is your town between study sessions. Finish a focus interval to earn coins and energy. Spend them on repairs, lights and a place worth coming back to.",
    hint: "No timers start during this tour.",
  },
  {
    title: "Pick one small job",
    art: "clock",
    body: "Write your task above the clock. Sessions lets you set focus time, both breaks and the number of rounds. The next focus round waits for you to press Start.",
    hint: "Try 25 minutes of work, then a 5-minute break.",
  },
  {
    title: "Take the long way home",
    art: "map",
    body: "Open Town. Walk with WASD or the arrow keys, then press E beside a door, person or curious object. On a phone, use the direction buttons and Use.",
    hint: "Your house is left of the fountain. The shop is straight north.",
  },
  {
    title: "Follow the little oddities",
    art: "letter",
    body: "Jun has questionable tea advice. Miso has a shop to supervise. Your bookshelf and the river atlas share a clue. Check the Missions noticeboard when you need a goal.",
    hint: "Read both clues, then try the bell. Some discoveries wait until night.",
  },
  {
    title: "Make yourself at home",
    art: "home",
    body: "Settings keeps your name, clothes and town lighting. Your progress saves in this browser. Download a progress backup before moving to another device.",
    hint: "Together makes an invite for friends. Everyone readies up before the host starts.",
  },
] as const;
export function TourPicture({ kind }: { kind: string }) {
  return (
    <svg
      className="tour-picture"
      viewBox="0 0 192 64"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path d="M12 52H180V56H12Z" fill="#c5ae85" />
      {kind === "key" ? (
        <>
          <path
            d="M62 16h28v28H62zM88 28h42v8h-8v8h-8v-8h-26z"
            fill="#b08742"
          />
          <path d="M70 24h12v12H70z" fill="#f3e7d1" />
        </>
      ) : kind === "clock" ? (
        <>
          <path d="M48 6h96v48H48z" fill="#5c4434" />
          <path d="M54 12h84v36H54z" fill="#292c29" />
          <text
            x="96"
            y="40"
            textAnchor="middle"
            fontFamily="VT323"
            fontSize="30"
            fill="#f3e7d1"
          >
            25:00
          </text>
          <path d="M54 30h84v1H54z" fill="#171b19" />
        </>
      ) : kind === "letter" ? (
        <>
          <path d="M54 10h84v44H54z" fill="#d8c19a" />
          <path d="M60 16h72v32H60z" fill="#faf1df" />
          <path d="M90 27h12v12H90z" fill="#ad5b3e" />
          <path d="M64 20h20v3H64zM108 42h20v2h-20z" fill="#bba57e" />
        </>
      ) : (
        <>
          <path d="M36 24h40v28H36zM122 20h30v32h-30z" fill="#d8bd8b" />
          <path d="M30 24l26-20 26 20zM116 20l21-17 21 17z" fill="#a7684b" />
          <path d="M52 38h10v14H52zM132 36h10v16h-10z" fill="#644633" />
          <path d="M46 52h94v4H46zM94 34h12v20H94z" fill="#ae9a78" />
          <path d="M90 28h20v8H90z" fill="#6e8260" />
          <path
            d="M40 30h8v8h-8zM66 30h6v8h-6zM126 26h8v6h-8z"
            fill="#e9b961"
          />
        </>
      )}
    </svg>
  );
}
