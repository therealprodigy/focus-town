# Focus Town

A quiet place to finish something. Set a timer in the observatory, or walk through Greenvale with a lantern and a few friends.

```text
       .--.
       |::|    GREENVALE
      _|__|_   one page at a time
        ||
```

## Start in VS Code

1. Open this folder. On a fresh checkout, run **npm install** in the integrated terminal. Use Node 26 or newer; local co-op uses its built-in SQLite.
2. Click **Run and Debug** in the left sidebar.
3. Select **Focus Town: start preview**, then click the green play button. This starts the server and opens the game.
4. If the server is already running, open [the local game](http://127.0.0.1:5173/) in Brave. Keep the preview terminal open.

The game opens in **Focus**. Open **Sessions**, pick a preset or enter your own times, then press **Start focus**. Use **Town** to explore. WASD or arrow keys move; E interacts. The corners icon in the bottom dock enters full screen. Escape exits full screen or closes a dialog.

If the address cannot connect, use **Terminal > Run Task > Focus Town: start preview**. If port 5173 is already in use, use the existing preview. Do not open index.html directly.

## What is here

- An original observatory scene, a large clock, one editable task line and a compact dock.
- Focus, short breaks and long breaks from 1 to 720 whole minutes.
- Four presets and custom Pomodoro plans with 1 to 12 rounds. The final round leads to a long break. Breaks can start automatically; the next focus round waits for you.
- Pause, resume, reload recovery, rewards and a seven-day journal.
- Two walkable rooms, larger pixel characters, villagers, small pieces of lore and a twelve-minute day/night cycle.
- Five story chapters unlocked by completed solo focus.
- Invite rooms for up to eight people, with a shared timer, companion positions and a river beacon.
- Save backups, storage information, privacy and terms pages, and a custom 404.

The shop, library interior, forest, combat, equipment and music are planned. Their notices are readable; those systems are not working features yet.

## Together

Open **Together**, enter a nickname and create a room. Copy its invitation for someone who can access the same hosted site. The host controls the timer. Guests can leave without changing everyone else's session.

Positions update about once per second in Town, more slowly in Focus or a hidden tab. This is relaxed companion play. Completed co-op time lights the river beacon; it does not award solo coins or write to another player's journal. Rooms expire after 24 hours. Closing as host requires a confirmed server response.

A localhost invitation works only on this Mac. The initial hosted Site is owner-private. A room invitation does not bypass the Site's access controls.

## Where progress lives

Solo progress stays in this browser on this device. **Settings > Export save** makes a backup; **Import save** restores one after confirmation. Clearing site data removes the local copy. There is no account-based personal save sync.

The original focusraid-save-v1 storage key and focusraid-save-writer lock preserve earlier progress through the rename. Completion and rewards are saved together. One tab holds the writing lock; another waits. A damaged save blocks ordinary writes but can be replaced with a valid backup.

A streak day needs 25 completed minutes. Several sessions can add up to that total. Missing a day never removes coins or XP. Running timers retain their deadline; paused timers retain their remaining time. Personal time uses the device clock and is not verified attendance or work time.

Hosted rooms store nicknames, hashed membership secrets, presence, character positions and shared timer state in a separate database. Task text and personal journals stay local. Development rooms live in the ignored .sites-runtime folder.

## Checks and your debugging pass

**Terminal > Run Task** includes **Focus Town: test** and **Focus Town: build**.

On 9 October 2026, **59 automated tests and the production build passed**. They cover timer transitions, rewards, reloads, streaks, movement, room permissions, concurrent controls, expiry, membership limits and stale companion updates.

Browser layout, full screen, touch controls, backup dialogs and two-device co-op still need the owner's manual pass. Start with [TEST_PLAN.md](TEST_PLAN.md). Automated checks do not establish visual quality.

## Inside the project

React, Vite, TypeScript and Tailwind handle the interface. A shadcn-style Radix/CVA button supplies the shared controls. Canvas draws the town. Pure timer rules live in src/game/state.ts. The room service uses Drizzle migrations with local SQLite and hosted D1. See [ARCHITECTURE.md](ARCHITECTURE.md).

[Flocus](https://flocus.com/features/pomodoro-timer) informed the timer hierarchy; [Aceternity](https://ui.aceternity.com/components/floating-dock) informed the compact dock. Their artwork and site code are not bundled. [ASSETS.md](ASSETS.md) records the scene and font licenses.

AI assisted implementation, artwork, tests and documentation. The owner supplies design direction and manual playtesting. No human coding hours or Pixl submission are claimed. The .wakatime-project identifier remains focusraid to preserve tracking history.
