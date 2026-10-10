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

## 9 October 2026: bringing the town into the same world

The owner clarified that the existing town should keep its layout and movement. Its art now uses the observatory’s blue, lavender and brass palette. Lanterns, a striped shop awning, a library telescope, a roof cat and weathered compass stones give the square a few recognisable details. An atlas and a quiet bell carry two short pieces of the existing missing-hour story.

Town now has its own collapsible timer. Focus and Town share Start, Pause, Resume, round transitions and completion feedback. The desk and bed open session choices in place. Closing those choices leaves the player in the same view. A camera fills the available window and follows the character on narrow screens without changing map or co-op coordinates.

Review caught invalid host durations closing the session dialog, timer overlap on short portrait screens, and the drawing order of the new props. These were corrected. Through VS Code, 65 automated tests, the production build and the built Worker checks passed. The route checks still reach every interaction, including the new objects. Browser appearance, touch controls and the complete in-town session flow await the owner’s manual pass.

AI assisted implementation, artwork, review and documentation. This entry records project changes and automated results, not personal coding hours or a completed human playtest.

## 9 October 2026: one page, then a walk

I wanted a study timer that gives you somewhere to go when the interval ends. The idea became Greenvale: a small village with a library, a tea stall and a cat with no interest in your deadlines.

The first problem was consistency. The focus page felt calm, but the town looked like a different project. I asked for the same blue-hour mood, pixel lettering and a clearer timer. Custom focus and break lengths, session presets and multi-round plans were added. The controls were also adjusted for short landscape screens.

The town now has noticeboard missions, discoveries and a shop. Coins buy porch lanterns, moonflowers, a fountain repair and festival bunting. Those purchases change the scenery and survive a missed streak. I also spotted a route around the broken bridge: the forest was supposed to be closed, but you could walk straight past it. That boundary was fixed and checked for reachable gaps.

Together rooms add invitations, ready checks and one timer controlled by the host. Completed intervals produce server receipts so reconnecting does not lose a reward or award it twice. Friends can compare recorded focus totals and see the host's upgrades. The totals are reported by the device; they are not proof that someone studied.

The sound library includes five credited CC0 files. Saves stay in the browser, with export and import for backups. The old save key was kept during the rename from FocusRaid so existing progress would still load.

Publishing took longer than expected. The first hosting route failed during upload, and Cloudflare setup stalled. The game is now at https://focus-town-greenvale.vercel.app on Vercel, with Turso for shared rooms. The public site and custom 404 respond correctly. A live API check caught an import-path error that local tests had missed; the imports were corrected and the deployed service was checked again. Two test profiles joined a room, shared a timer and received one saved reward each. Repeating reward collection kept the same receipt until acknowledgement. The mogging comparison also kept its leader on a tie and switched when the other total overtook it.

The automated suite passed 113 tests. Another run checked 22 existing room and reward tests against the hosted database adapter. Visual layout, audio levels and two-device play still need my manual pass.

I supplied the concept, design direction, feedback and bug reports, and contributed bug fixes and work on the friends feature. Codex did much of the implementation, debugging and automated testing. The observatory background used image generation; the asset credits record it. This entry describes the linked Focus Town work, not unrelated projects or extra claimed hours.

## 9 October 2026: names and safer saves

Players can choose a character name in Settings. Old saves still load, and new names carry across progress backups. The save screen explains which browser holds progress and how to move it. A recovery copy can be reviewed if the main save is damaged; it is never silently restored. Import is blocked during sessions and room visits.

The README leads with the public game and uses npm start for desktop source downloads. The updated suite passed 121 tests, both production builds and Worker route/audio checks. Source review found no shipping blockers. Visual layout and two-device play remain for the owner to check. Implementation and review were AI-assisted; no extra human hours are claimed here.

## 10 October 2026: across the Old Crossing

Greenvale has more room now. The Old Crossing is repaired in three stages with coins and energy, opening a glasshouse, orchard, telescope and a bench with two mugs: Start and Again. The original buildings have different details instead of repeating the same facade. The interface uses flat signboards, pixel symbols and local pixel fonts.

The update adds coat, skin and headwear choices, five more missions, 14- and 30-day streak rewards, and Jun's coffee. Coffee lasts thirty real minutes, makes walking faster and adds a small bonus to the solo focus time it covers. Pausing cannot turn a short coffee window into a bonus for an entire long session.

Town lighting can follow a twelve-minute day, local time, daylight or evening. Night discoveries use that same clock. Reduced motion stops residents and decoration without freezing study time. Optional encouragement has gentle, direct and playful settings, plus Off.

Review caught a house beam and a shop crate covering their doors, a reduced-motion interaction mismatch, moving residents that could trap the player, and an old multiplayer boundary that rejected the expanded garden. Those are fixed. All 148 automated tests, both production builds and the route/audio checks pass. Browser layout and a real two-device playtest are still pending; automated results do not prove those work.

The README explains downloads, local saves, backup transfer and shared rooms. SECRETS.md lists the small discoveries. Code and documentation changes were made through VS Code. This update used AI-assisted implementation and review; it claims no additional human coding hours. Pixl posting is a separate step from this repository journal.

The source update was pushed to GitHub as 6531174. Vercel rejected the production deployment because the active account cannot access the existing project, so the public game has not received this update yet. Pixl journal posting could not be confirmed through the Brave connection. The reviewer note and previously recorded hours were not changed.

## 10 October 2026: a warmer desk, a lighter town

The screenshots made the problem clear: the same dark teal rectangle covered nearly every interaction. The room was mostly empty purple floor. This pass replaces that treatment with parchment sheets, walnut controls and brass details. The town timer takes less space, and the duplicate town title is gone.

Greenvale now uses plaster walls, timber framing, clay and slate roofs, warmer paths and greener trees. Lantern House has an oak floor, a rust-coloured rug and quilt, a fireplace, a broom rail and a travel poster. The garden and main village share the same ground colour so the time of day no longer changes the terrain in a sudden step.

The focus page has a split-flap clock, three lighting choices and a plain-digit option. A short welcome guide explains movement, sessions, repairs and backups, and can be replayed. The listening shelf adds fan, pine-wind and shore loops made with Web Audio. Preferences persist, playback does not.

Review caught two audio-switching races, an old completion that could chime after reloading, and a welcome guide that could interrupt a menu. Those were fixed. All 154 automated tests and both production builds pass. Six new tests check the clock, reachable house discoveries, saved discoveries and audio cleanup. Browser appearance and listening checks remain open because the preview permission is blocked. These are implementation notes, not a claim of manual playtesting or additional human coding hours.

## 10 October 2026: a desk of your own

The next pass gives each place its own material: clay controls around the focus desk, frosted glass over the village and paper for reading. Night still falls, but the blue tint is lighter. The grass and oak floor are brighter too.

The desk can now use the observatory, a drawn garden morning or a quiet paper background. Clock finish, size, task visibility and encouragement are saved preferences. Collapsing the timer leaves its countdown and controls within reach. Resetting the desk leaves session lengths and progress alone.

The welcome guide now asks for a character name and a first task, offers focus lengths, and includes a small practice yard. Walk around a stone, reach the sign and press E. Touch buttons do the same job. The practice has no connection to coins, discoveries or the actual player position.

Automated verification passed 161 tests and the production build before final review. New checks cover preference migration, persistence, invalid settings, practice boundaries, interaction reach and built-in backgrounds. Review found an old short-screen grid conflicting with the compact timer and name feedback hidden behind the tutorial. Both were corrected. Visual and touch testing remain pending because the browser preview permission is still blocked. This entry records AI-assisted implementation; no additional human hours are claimed.

Final source review found no remaining blockers. All 161 tests and both production builds passed after the fixes. Rendered appearance remains unverified.
