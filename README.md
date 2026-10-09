# Focus Town

I made Focus Town because normal Pomodoro timers were boring. I wanted the time spent focusing to leave something behind: a lit window, a few coins, a place worth coming back to.

```text
       .--.
       |::|    GREENVALE / CHAPTER 01
      _|__|_   one page at a time
        ||
```

Focus Town is a small browser game about a lantern apprentice. Walk through Greenvale, head home, and sit at the desk. While you work, your apprentice studies too.

## What you can do

- Walk through the village and enter Lantern House.
- Talk to Rowan and Mira, read village notices, and find a few odd scraps of lore.
- Focus for 15, 25, 45, or 60 minutes. Pause, resume, or end a session early.
- Collect energy, XP, and coins after a completed session, then take an optional rest.
- Check completed sessions and streaks in the notebook.

The shop, library, forest, quests, and combat are still being built. Their signs are readable; their gameplay is not available yet. This is a local prototype, with no verified public demo.

## Run it in VS Code

1. Open this folder in VS Code. On a fresh checkout, run `npm install` in its terminal once.
2. Open **Run and Debug** and choose **Focus Town: start preview**.
3. Press the green play button. VS Code starts the server, waits until it is ready, and opens the game.
4. Click **Enter Greenvale**.

This checkout was built and tested with Node 26.5.0.

To play in Brave, choose **Terminal > Run Task > Focus Town: start preview**, then type `http://127.0.0.1:5173/` into Brave’s address bar. Keep the preview terminal open while playing. Do not open `index.html` directly.

**Terminal > Run Task** also has tasks for tests and the production build.

## First walk

Use **WASD** or the **arrow keys** to move. Press **E** near a person, sign, door, desk, or bed. **Escape** closes a dialog. On a touch screen, use the arrow buttons below the game.

From the fountain, walk left and then up toward Lantern House. Enter through its door. Inside, the desk is at the top left; the bed is across the rug. Click the game again if movement stops after using a menu.

## Sessions and saving

| Focus | Energy | XP | Coins | Suggested rest |
| --- | ---: | ---: | ---: | --- |
| 15 minutes | 15 | 12 | 6 | 3 minutes |
| 25 minutes | 25 | 25 | 12 | 5 minutes |
| 45 minutes | 45 | 50 | 22 | 8 minutes |
| 60 minutes | 60 | 70 | 30 | 10 minutes |

Completed sessions earn rewards once. Ending early earns none. Breaks never earn focus rewards. A day counts toward the keeper-flame streak after 25 completed minutes; two 15-minute sessions count too. A session belongs to the local calendar date when its timer ends.

Progress is stored in this browser under `focusraid-save-v1`. The original key stays in place so the rename preserves existing saves. Running timers use a saved deadline, so closing the tab does not reset them. Paused timers stay paused. A browser lock lets one tab write to the notebook at a time; other tabs can explore while they wait.

There is no account or cloud sync. Clearing browser data removes progress. Damaged or unsupported saves are kept intact and block new sessions rather than being silently replaced. If saving fails, the game shows a warning and does not apply the unsaved change.

This is a personal focus companion, not proof of study time. It uses the device clock.

## Checks

```sh
npm run test
npm run build
```

On 8 October 2026, 20 automated tests and the production build passed. The tests cover timer rewards, reloads, pause/resume, cancellation, dates, damaged saves, movement, collision, and routes to every interaction. Browser playtesting and visual review are still pending.

## Inside the project

- `src/game/world.ts`: rooms, collision areas, conversations, and interactions.
- `src/game/renderer.ts`: original pixel characters and scenery drawn on Canvas.
- `src/game/engine.ts`: movement, input, scene changes, and desk-to-bed movement.
- `src/game/state.ts`: saved progress, timer transitions, rewards, and streaks.
- `src/App.tsx`: accessible menus, notebook, and session controls.
- `tests/core.test.ts`: the main rules and route checks.

React, TypeScript, Vite, and Canvas keep the first two rooms small enough to understand. No game-art downloads are bundled. Google Fonts serves DM Sans and Fraunces; system fonts are used if those requests fail.

## References and credits

[Spirit City](https://store.steampowered.com/app/2113850/Spirit_City_Lofi_Sessions/) and [Virtual Cottage](https://dui.itch.io/virtual-cottage) informed the quiet focus-companion direction. [Habitica](https://habitica.com/) and [Forest](https://www.forestapp.cc/) were references for progress tied to real tasks. Focus Town uses its own setting, names, dialogue, and pixel designs.

Useful art tools for future manual work: [Piskel](https://www.piskelapp.com/), [Aseprite](https://www.aseprite.org/), [Tiled](https://www.mapeditor.org/), and [Lospec](https://lospec.com/palette-list).

AI helped with research, design, code, tests, and writing. See [DEVLOG.md](DEVLOG.md) and [ROADMAP.md](ROADMAP.md). No tracked human hours or personal playtest results are claimed here.

The `.wakatime-project` identifier stays `focusraid` to preserve the project’s tracking history.
