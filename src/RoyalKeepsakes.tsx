import type { SaveData } from "./game/state";
import { ownedRoyalItems } from "./game/townProgress";

const ITEMS = [
  {
    id: "compass",
    name: "Brass compass",
    detail: "Points to your next request.",
    clue: "Deliver Edda’s letter.",
  },
  {
    id: "projector",
    name: "Pocket projector",
    detail: "Ask Pip to show the restored reel.",
    clue: "Find the lost reel and platform ticket.",
  },
  {
    id: "seal",
    name: "Keeper’s seal",
    detail: "Oren’s stamp. He checked it twice.",
    clue: "Complete A watch of your own.",
  },
  {
    id: "crown",
    name: "Keeper’s crown",
    detail: "Yours to wear. No royal duties before breakfast.",
    clue: "Finish the coronation request.",
  },
  {
    id: "ribbon",
    name: "Garden ribbon",
    detail: "For taking the long way home.",
    clue: "Finish the garden rounds.",
  },
  {
    id: "cloak",
    name: "King’s cloak",
    detail: "A travelling cloak, with unreasonable amounts of trim.",
    clue: "Finish the final Cherrybank request.",
  },
] as const;

export function KeepsakeIcon({ kind }: { kind: (typeof ITEMS)[number]["id"] }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="48"
      height="48"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {kind === "compass" && (
        <>
          <path d="M10 4h12v4h4v16h-4v4H10v-4H6V8h4z" fill="#bb9150" />
          <path d="M11 7h10v3h3v12h-3v3H11v-3H8V10h3z" fill="#ede0b4" />
          <path d="M16 9l-5 11 5-3 5 3z" fill="#9a5244" />
          <path d="M16 17v7l5-4z" fill="#597c79" />
        </>
      )}
      {kind === "projector" && (
        <>
          <path d="M7 13h18v11H7zM10 24h3v5h-3zM20 24h3v5h-3z" fill="#6f817c" />
          <path d="M5 3h9v9H5zM17 3h9v9h-9z" fill="#c49b65" />
          <path d="M8 6h3v3H8zM20 6h3v3h-3z" fill="#f4e5be" />
          <path d="M25 15h5v7h-5z" fill="#d3ae71" />
          <path d="M10 16h10v2H10z" fill="#dae1ca" />
        </>
      )}
      {kind === "crown" && (
        <>
          <path d="M4 9h4v6h5V6h6v9h5V9h4v17H4z" fill="#ddb661" />
          <path d="M4 24h24v4H4z" fill="#a57737" />
          <path d="M14 17h4v5h-4z" fill="#657f89" />
          <path d="M6 19h3v3H6zM23 19h3v3h-3z" fill="#ab594e" />
        </>
      )}
      {kind === "cloak" && (
        <>
          <path d="M11 5h10l7 23H4z" fill="#883f43" />
          <path d="M11 5h2L7 26h18L19 5h2l8 25H3z" fill="#d8ad58" />
          <path d="M9 5h14v6H9zM12 11h8v3h-8z" fill="#f1e2c5" />
          <path d="M14 6h4v4h-4z" fill="#b3914f" />
        </>
      )}
      {(kind === "seal" || kind === "ribbon") && (
        <>
          <path
            d="M8 15h6v15l-3-4-3 4zM18 15h6v15l-3-4-3 4z"
            fill={kind === "ribbon" ? "#718b70" : "#8a524c"}
          />
          <path d="M9 3h14v4h4v13h-4v4H9v-4H5V7h4z" fill="#d6b269" />
          <path d="M12 7h8v3h3v7h-3v3h-8v-3H9v-7h3z" fill="#f1dfb3" />
          <path d="M15 9h3v8h-3zM12 12h9v3h-9z" fill="#9a713f" />
        </>
      )}
    </svg>
  );
}

export function RoyalKeepsakes({
  save,
  openWardrobe,
}: {
  save: SaveData;
  openWardrobe: () => void;
}) {
  const owned = ownedRoyalItems(save);
  return (
    <section className="keepsake-shelf" aria-label="Keepsakes">
      <div className="keepsake-heading">
        <h3>On your mantel</h3>
        <button className="small-link" onClick={openWardrobe}>
          Open wardrobe
        </button>
      </div>
      <ul>
        {ITEMS.map((item) => (
          <li key={item.id} data-owned={owned[item.id]}>
            <KeepsakeIcon kind={item.id} />
            <div>
              <strong>{item.name}</strong>
              <small>{owned[item.id] ? item.detail : item.clue}</small>
            </div>
            <span className="keepsake-state">
              {owned[item.id] ? "Earned" : "To find"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
