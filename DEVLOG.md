# Development log

## 8 October 2026: a desk to come back to

The opening screen has become two connected places: Greenvale and Lantern House. The apprentice can walk around walls and trees, talk to Rowan and Mira, and read the village notices. The scenery and characters are original pixel drawings built in Canvas.

The desk offers 15, 25, 45, and 60 minute focus sessions. Completed sessions earn energy, XP, and coins. Pausing keeps the remaining time; a running session keeps its deadline through a reload. Breaks lead the apprentice to bed and give no extra rewards.

The tricky part was keeping progress consistent. A finished timer and its rewards are saved together. A browser lock prevents two tabs from writing to the same notebook. Review also caught a stale interaction prompt after scene changes and a lock-acquisition race during React development reloads; both were corrected before the latest build.

### Verified

- 20 automated tests passed.
- The production build passed.
- Route tests reached every village and house interaction from its spawn.

### Still to check

- The village and house in a real browser at desktop and phone sizes.
- Keyboard and touch movement, focus recovery, and dialog closing.
- Reloading an active or paused timer and handing the notebook between two tabs.
- How the character looks while studying, walking to bed, and waking up.

Browser preview access was declined during this development session, so these remain unverified. The shop, library, forest, enemies, quests, and equipment are future work. Nothing has been submitted to Pixl or published as a playable release by this entry.

### Pixl journal draft

This update adds a village, a house, and the first focus loop. The apprentice can reach the desk, choose a session, and save its timer and progress locally. I used AI assistance for the implementation, pixel drawings, tests, and documentation. Automated checks passed, but the full browser playtest is still pending. The next useful test is the complete walk from the fountain to the desk, followed by a pause and reload.

This draft describes project changes. It does not claim human coding hours or a personal playtest. Before posting it, add what you worked on yourself, what confused you, and what you noticed while playing. Any required time entry must match verified Hackatime records.

## 9 October 2026: Focus Town

Renamed the game to Focus Town. The original save key and time-tracking identifier remain in place so existing history stays together. Removed the separate AI disclosure file at the owner’s request; disclosure belongs in the submission form when it is filled out.

The local preview had no running server. The VS Code Run configuration now starts Vite, waits for its ready address, and then opens the game.

The owner will run the game and do the next debugging pass. The updated Run configuration has not yet been tested interactively.

## 9 October 2026: pixel interface and a changing sky

The owner reported that the game worked, but the page felt generic. This update removes the serif welcome card, chapter captions and framed resource stats. Silkscreen and VT323 are bundled locally. The controls helper can be hidden and restored; its preference survives a reload.

Greenvale now has textured paths, fuller trees, flowers, reeds, stone details and larger characters. Rowan and Mira have different palettes. A full day lasts twelve real minutes, with dawn, daylight, dusk and night. The house window shows the sky, and lanterns light up at night. Review caught lights drawing over the apprentice; they now follow the same depth order as the buildings and furniture.

Focus and break lengths accept whole minutes from 1 to 720. A selected break is retained through pause, reload and completion. The journal shows seven days of completed focus, the current streak and the best streak. Days still require 25 completed minutes; an unfinished day does not erase yesterday's streak.

Verified through commands run in VS Code: 41 automated tests passed and the production build passed. Browser appearance and interaction checks are still pending. AI assisted the code, artwork and documentation; this entry claims no human coding hours or personal playtest results.

## 9 October 2026: the observatory and shared rooms

The owner wanted the page to feel calmer and more deliberate. The opening view now places a large timer over an original observatory illustration. Focus and Town are separate views, with a small dock for sessions, company, journal and settings. The town still uses original pixel characters and changing daylight. The example hero was a composition reference; its brand, video and copy were not used.

Pomodoro plans now capture their intervals and round count, lead to a final long break, and optionally start breaks automatically. New focus rounds wait for a click. Backup export and explicit restoration explain where personal progress lives. Damaged saves can be recovered without letting ordinary actions overwrite them.

Co-op now has a real room service: eight-member invitations, host controls, presence, approximate companion movement and a river beacon. Review caught room-closure recovery, joining-versus-solo races, stale position updates and ambiguous break labels. Those were corrected. Shared completion is counted once, while personal progress remains local.

The source was edited and development commands ran through VS Code. The implementation uses React, TypeScript, Vite, Tailwind, Canvas and SQLite/D1 migrations. Fonts are local; the scene and licenses are recorded in ASSETS.md. Privacy, storage, terms and a custom 404 are included. No separate AI disclosure file was created.

The latest automated run passed 59 tests and the production build. Browser layout and two-device play remain unverified because the owner chose to do that pass. TEST_PLAN.md lists the clicks and expected behavior. AI assisted implementation, artwork, testing and writing; this entry claims no human coding hours or personal playtest observations.
