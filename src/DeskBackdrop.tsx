import type { deskDefaults } from "./deskPreferences";
export function DeskBackdrop({
  kind,
}: {
  kind: typeof deskDefaults.background;
}) {
  if (kind === "observatory")
    return (
      <img
        className="scene-backdrop"
        src="/art/observatory.png"
        alt=""
        fetchPriority="high"
      />
    );
  return (
    <svg
      className={"scene-backdrop drawn-backdrop " + kind + "-backdrop"}
      viewBox="0 0 960 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {kind === "paper" ? (
        <>
          <rect width="960" height="600" fill="#eee0c5" />
          <path d="M22 0h5v600h-5zM0 570h960v3H0z" fill="#d7c4a1" />
          <path
            d="M26 40h40v4H26zM26 552h80v3H26zM880 0h3v600h-3z"
            fill="#c8b18b"
          />
          <g transform="translate(68 404) rotate(-8)">
            <rect width="112" height="126" fill="#9c674b" />
            <path d="M8 6h100v110H8z" fill="#faf0d9" />
            <path
              d="M16 20h68v3H16zM16 32h78v2H16zM16 44h61v2H16zM16 56h72v2H16zM16 68h54v2H16z"
              fill="#c7b08c"
            />
            <path d="M70 0h10v46l-5-5-5 5z" fill="#b37650" />
          </g>
          <path d="M824 428h46v42h-46z" fill="#b37b54" />
          <path d="M820 420h54v10h-54z" fill="#cc9868" />
          <path
            d="M843 354h5v66h-5zM819 370h24v8h-24zM846 352h22v9h-22zM822 390h24v8h-24zM846 380h24v9h-24z"
            fill="#718254"
          />
          <path d="M826 482h52v12h-52z" fill="#dac49f" />
          <circle cx="850" cy="478" r="17" fill="#f9eed6" />
          <circle cx="850" cy="476" r="11" fill="#805839" />
        </>
      ) : (
        <>
          <rect width="960" height="600" fill="#d9e5dc" />
          <path
            d="M0 218h80v-24h72v-18h94v14h68v20h120v-14h106v-25h84v18h92v21h100v-23h66v31h78v200H0z"
            fill="#b7c7aa"
          />
          <rect y="272" width="960" height="328" fill="#a3b483" />
          <path
            d="M0 322h192v-20h140v24h201v-12h139v-26h132v14h156v298H0z"
            fill="#8fa56d"
          />
          <path
            d="M0 492h354v-24h150v-16h234v-26h222v66H768v22H522v18H368v24H0z"
            fill="#d1bc8f"
          />
          <path
            d="M780 60h86v12h-86zM756 72h146v12H756zM130 102h68v10h-68zM110 112h116v12H110z"
            fill="#f5f2db"
          />
          <path d="M66 170h20v268H66zM83 254h34v12H83z" fill="#806444" />
          <path
            d="M0 140h146v-24h-22V86H26v26H0zM0 160h166v66H0zM0 232h122v54H0z"
            fill="#607c4e"
          />
          <path
            d="M0 149h124v10H0zM26 190h80v12H26zM0 248h74v12H0z"
            fill="#819951"
          />
          <g transform="translate(774 300)">
            <path d="M0 44h118v110H0z" fill="#e0c79b" />
            <path
              d="M-10 40h138v10H-10zM0 26h118v14H0zM14 12h90v14H14zM28 0h62v12H28z"
              fill="#a66d4c"
            />
            <path
              d="M4 54h6v94H4zM108 54h6v94h-6zM0 107h118v6H0z"
              fill="#91734e"
            />
            <path d="M15 68h27v26H15zM78 68h27v26H78z" fill="#eabc65" />
            <path d="M26 68h4v26h-4zM89 68h4v26h-4z" fill="#735b41" />
            <path d="M48 104h22v50H48z" fill="#7c593d" />
            <path d="M86 -22h14v36H86z" fill="#b8a487" />
          </g>
          {[32, 166, 248, 642, 735, 900].map((x, i) => (
            <g
              key={x}
              transform={"translate(" + x + " " + (548 - (i % 3) * 15) + ")"}
            >
              <path d="M4 0h3v21H4zM0 9h10v3H0z" fill="#4c7144" />
              <path
                d="M1 0h9v5H1zM4 -3h3v11H4z"
                fill={i % 2 ? "#edcb84" : "#f1dfbd"}
              />
            </g>
          ))}
          <path d="M0 580h960v20H0z" fill="#6d8956" />
        </>
      )}
    </svg>
  );
}
