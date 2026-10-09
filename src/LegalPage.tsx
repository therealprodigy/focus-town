import { Button } from "./components/ui/button";
const pages: Record<
  string,
  { title: string; sections: { title: string; text: string }[] }
> = {
  "/privacy": {
    title: "Your time stays yours.",
    sections: [
      {
        title: "Personal progress",
        text: "Focus Town stores your character name, sessions, coins, energy, village upgrades, discoveries, mission claims, story progress, timer state and preferences in local storage in your browser. There is no personal account or automatic cross-device backup. Download a progress backup in Settings to move it yourself. A recovery copy is also kept in the same browser; clearing site data removes both copies. Backups do not include timer preferences or online identity.",
      },
      {
        title: "When you join a room",
        text: "The room service stores nicknames, hashed device and room secrets, presence, character positions, shared sessions and reward receipts. Your device profile reports total focus minutes, best streak and village upgrades for invited players to compare. Pair standings and profiles persist beyond room expiry. Your task text and detailed solo journal stay local. Clearing site data loses the device secret; importing a game save does not recover that identity.",
      },
      {
        title: "Room lifetime",
        text: "Room access expires after 24 hours. Expired room records are removed when the service next performs cleanup. Closing a room removes its room and membership records. Short-lived hashed request counters help limit abuse. Hosting infrastructure may retain operational request logs according to its own policies.",
      },
      {
        title: "Questions",
        text: "For bugs or data questions, use the issue tracker linked below. Do not post invitation secrets or private save files in a public issue.",
      },
    ],
  },
  "/cookies": {
    title: "Storage, without the mystery.",
    sections: [
      {
        title: "Required local storage",
        text: "The game uses browser local storage for the save, its recovery copy, preferences and this notice. It uses session storage for your current co-op membership so you can reconnect after a reload. These are browser storage technologies, not advertising cookies.",
      },
      {
        title: "Optional tracking",
        text: "This game does not include advertising, analytics SDKs or optional tracking cookies. Fonts and artwork are served with the game. There are no optional trackers to accept. The hosting service may use its own authentication and security cookies outside the game.",
      },
      {
        title: "Your controls",
        text: "Export a backup in Settings before clearing site data. Your browser’s site-data controls can remove local saves and room credentials. Leaving a room ends your membership on the room service when the request reaches it.",
      },
    ],
  },
  "/terms": {
    title: "A few ground rules.",
    sections: [
      {
        title: "Use the town kindly",
        text: "Focus Town is a personal focus tool and a small browser game. Choose a nickname you are comfortable sharing. Invite people you trust. Do not impersonate others, harass players or attempt to access rooms without an invitation.",
      },
      {
        title: "Game progress",
        text: "Coins, energy and story progress are game values. They have no cash value. The timer is a planning aid and is not a verified record of work, school attendance or billable hours.",
      },
      {
        title: "Availability and saves",
        text: "The game is provided as an evolving project. Features can change, rooms can become unavailable, and browser data can be lost. Keep an exported backup if your progress matters to you. These terms do not remove rights that apply under your local law.",
      },
      {
        title: "Artwork and code",
        text: "External fonts and components retain their original licenses. See the repository’s asset credits for sources. Please report a problem through the issue tracker.",
      },
    ],
  },
};
export function LegalPage() {
  const p = pages[location.pathname];
  return (
    <main className="document-page">
      <img className="scene-backdrop" src="/art/observatory.png" alt="" />
      <article>
        <a className="wordmark" href="/">
          focus town
        </a>
        {p ? (
          <>
            <p className="eyebrow">FOCUS TOWN · UPDATED 9 OCTOBER 2026</p>
            <h1>{p.title}</h1>
            {p.sections.map((s) => (
              <section key={s.title}>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
              </section>
            ))}
            <a href="https://github.com/therealprodigy/focus-town/issues">
              Project issue tracker
            </a>
          </>
        ) : (
          <>
            <p className="eyebrow">404 · OFF THE MAP</p>
            <h1>This path ends here.</h1>
            <p>The town is still there. This address is not.</p>
          </>
        )}
        <div className="button-row">
          <Button asChild variant="default">
            <a href="/">Return to town</a>
          </Button>
        </div>
        <nav className="legal-links">
          <a href="/privacy">Privacy</a>
          <a href="/cookies">Storage & cookies</a>
          <a href="/terms">Terms</a>
        </nav>
      </article>
    </main>
  );
}
