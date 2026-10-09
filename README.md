# Focus Town

A quiet place to finish something. Set a timer in the observatory, or walk through Greenvale with a lantern and a few friends.

       .--.
       |::|    GREENVALE
      _|__|_   one page at a time
        ||

## Start here in VS Code

1. Open this project folder. On a fresh checkout, run `npm install` in the integrated terminal. Use Node 26 or newer; local co-op uses Node's built-in SQLite.
2. Click **Run and Debug** in the left sidebar.
3. Select **Focus Town: start preview**, then click the green play button. This starts the local server and opens the game.
4. If the server is already running, open [the local game](http://127.0.0.1:5173/) in Brave. Keep the preview terminal open.

The game opens in **Focus**. Choose **Sessions**, pick a preset or enter your own times, then press **Start focus**. Use **Town** to walk around. Its timer has **Set sessions**, Start, Pause and Resume; the desk and bed also open session choices without leaving the town. WASD or the arrow keys move; E interacts. The corners icon in the bottom dock enters full screen. Escape exits full screen or closes a dialog.

If the address says it cannot connect, run **Terminal > Run Task > Focus Town: start preview**. If the terminal says port 5173 is already in use, use the existing preview instead of starting another one. Do not open index.html directly.

## What is here

- An original observatory backdrop, a large clock, one editable task line, and a compact tools dock.
- Focus, short break and long break intervals from 1 to 720 whole minutes.
- Four presets and custom Pomodoro plans with 1 to 12 rounds. The last round leads to a long break. Breaks can start automatically; the next focus round waits for you.
- Pause, resume, reload recovery, completed-session rewards and a seven-day journal.
- A village and house in the observatory’s blue-hour palette, with warm windows, lantern gardens, two villagers, an atlas and a quiet bell to inspect. Responsive framing follows the apprentice on small screens; a twelve-minute day/night cycle changes the light.
- Five story chapters unlocked by completed solo focus. Coins and energy are saved for later systems.
- Invite rooms for up to eight people: a host-controlled timer, companion positions, presence, and a river beacon fed by completed shared focus.
- Export/import backups, storage information, privacy and terms pages, and a custom 404.

The shop, library interior, forest, combat, equipment and music are still planned. Their signs are readable; those systems are not secretly working features.

## Together

Open **Together**, enter a nickname, and create a room. Copy its invitation for another player who can access the same hosted site. The host starts, pauses, resumes and ends intervals. Guests can leave without changing everyone else's timer.

Town positions update about once per second while the Town view is visible, more slowly in Focus or a hidden tab. This is companion play, not fast-action multiplayer. Co-op time lights the river beacon; it does not award solo coins or write to another player's journal. Rooms expire after 24 hours. Closing as host requires a confirmed server response.

A localhost invitation works only on this Mac. The initial hosted Site is private to its owner; an invitation does not bypass the Site's access controls.

## Where progress lives

Solo progress stays in this browser on this device. Settings has **Export save** and **Import save**. Clearing browser data removes the local copy. There is no account-based personal save sync.

The original `focusraid-save-v1` key and `focusraid-save-writer` lock preserve earlier saves through the rename. A completed session and its rewards are saved together. One tab holds the writing lock; another waits. A damaged save blocks ordinary writes, but a valid backup can be restored after explicit confirmation.

A streak day needs 25 completed minutes. Several sessions can add up to that total. Missing a day never removes coins or XP. Running timers retain a deadline; paused timers retain their remaining time. Personal time uses the device clock and is not verified work or study attendance.

Hosted rooms use a separate database for nicknames, hashed membership secrets, presence, character positions and shared timer state. Task text and personal journals stay local. The room capability stays in this tab's session storage. Development rooms live in the ignored .sites-runtime folder.

## Checks and your debugging pass

Run **Terminal > Run Task > Focus Town: test** for rules and room tests. **Focus Town: build** checks TypeScript and prepares the application.

On 9 October 2026, **65 automated tests and the production build passed**. Tests cover timer transitions, rewards, reloads, streaks, reachable interactions, real SQLite room permissions, concurrent controls, expiry, membership limits and stale companion updates.

Browser layout, full screen, touch controls, backup dialogs and two-device co-op still need the owner's manual pass. Start with the short checklist in [TEST_PLAN.md](TEST_PLAN.md). Automated checks do not establish visual quality.

## Inside

React, Vite, TypeScript and Tailwind handle the interface. A shadcn-style Radix/CVA button supplies the shared controls. Canvas draws the town. Pure timer rules live in src/game/state.ts; the room service is in server/room-service.ts. Drizzle migrations support local SQLite and hosted D1. See [ARCHITECTURE.md](ARCHITECTURE.md).

[Flocus](https://flocus.com/features/pomodoro-timer) informed the clear timer hierarchy. [Aceternity](https://ui.aceternity.com/components/floating-dock) informed the compact dock. Their artwork and site code are not bundled. [ASSETS.md](ASSETS.md) records the original scene and locally bundled font licenses.

AI assisted implementation, artwork, tests and documentation. The owner supplies the design direction and manual playtest. No human coding hours, Pixl submission or personal playtest results are claimed. The .wakatime-project identifier remains focusraid to preserve its tracking history.
