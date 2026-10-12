const RESIDENTS = {
  edda: {
    skin: "#deb69a",
    coat: "#765b79",
    trim: "#b290a8",
    hair: "#c5c5be",
    ground: "#7c9581",
  },
  oren: {
    skin: "#b98061",
    coat: "#819796",
    trim: "#b99262",
    hair: "#9f653f",
    ground: "#a88d70",
  },
  pip: {
    skin: "#e2b88c",
    coat: "#477c80",
    trim: "#e1ae75",
    hair: "#493c37",
    ground: "#7d9692",
  },
} as const;
export const hasResidentPortrait = (id: string): id is keyof typeof RESIDENTS =>
  Object.hasOwn(RESIDENTS, id);
export function ResidentPortrait({ id }: { id: string }) {
  if (!hasResidentPortrait(id)) return null;
  const p = RESIDENTS[id];
  return (
    <svg
      className="resident-portrait"
      viewBox="0 0 48 48"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <rect width="48" height="48" fill={p.ground} />
      <path d="M0 32h9V21h9v8h15V17h15v31H0z" fill="#efe0b828" />
      <path d="M1 4h8v3H1zM38 9h6v3h-6zM5 14h4v3H5z" fill="#e5bdac" />
      <path d="M15 31h18v3h5v14H10V34h5z" fill={p.coat} />
      <path d="M19 31h10v4H19zM22 35h4v13h-4z" fill={p.trim} />
      <path d="M16 12h16v4h3v13h-4v4H18v-4h-4V16h2z" fill={p.skin} />
      <path d="M16 11h16v6H16zM13 15h5v9h-5zM31 15h5v9h-5z" fill={p.hair} />
      <path d="M20 22h2v3h-2zM28 22h2v3h-2z" fill="#293d3d" />
      <path d="M22 29h6v1h-6z" fill="#855d4b" />
      {id === "edda" && (
        <>
          <path d="M29 7h8v8h-8z" fill="#e2dbcc" />
          <path
            d="M15 18h10v1H15zM17 21h7v6h-7zM27 21h7v6h-7z"
            fill="#c3ac74"
          />
          <path d="M19 23h3v2h-3zM29 23h3v2h-3zM24 23h3v1h-3z" fill="#493f35" />
          <path d="M33 36h9v12h-9z" fill="#b2b98f" />
          <path d="M35 37h5v9h-5z" fill="#e0c692" />
        </>
      )}
      {id === "oren" && (
        <>
          <path d="M17 27h17v6H17zM21 33h9v4h-9z" fill="#9f653f" />
          <path d="M15 11h19v6H15z" fill="#9f653f" />
          <path d="M17 35h16v13H17z" fill="#866045" />
          <path d="M21 40h8v5h-8z" fill="#816345" />
          <path d="M6 34h3v14H6zM3 33h10v5H3z" fill="#52666b" />
        </>
      )}
      {id === "pip" && (
        <>
          <path d="M15 11h19v6H15zM11 16h27v3H11z" fill="#5b5076" />
          <path d="M16 14h17v2H16z" fill="#83729a" />
          <path d="M35 35h9v9h-9zM37 37h5v5h-5z" fill="#d4b472" />
          <path d="M38 38h3v3h-3z" fill="#485c60" />
        </>
      )}
    </svg>
  );
}
