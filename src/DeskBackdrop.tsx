import { useState } from "react";
import type { deskDefaults } from "./deskPreferences";

type BackdropKind = typeof deskDefaults.background;

// Keep saved preference keys stable when the artwork or its display name changes.
export const DESK_BACKGROUNDS = {
  observatory: {
    name: "The observatory",
    src: "/art/observatory.png",
  },
  paper: {
    name: "Library window",
    src: "/art/library-study.webp",
  },
  garden: {
    name: "Garden morning",
    src: "/art/garden-morning.webp",
  },
} satisfies Record<BackdropKind, { name: string; src: string }>;

export function DeskBackdrop({ kind }: { kind: BackdropKind }) {
  const [failed, setFailed] = useState<BackdropKind | null>(null);
  const source =
    failed === kind
      ? DESK_BACKGROUNDS.observatory.src
      : DESK_BACKGROUNDS[kind].src;
  return (
    <img
      className="scene-backdrop"
      src={source}
      alt=""
      aria-hidden="true"
      fetchPriority="high"
      decoding="async"
      onError={kind === "observatory" ? undefined : () => setFailed(kind)}
    />
  );
}
