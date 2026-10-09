# Test plan

## Automated result

On 8 October 2026, `npm run test` passed 20 tests and `npm run build` completed successfully. These checks cover the game rules and compilation. They do not establish that the browser integration works.

Covered: reward amounts and single claims; reloads; pause/resume; cancellation at and before expiry; overlapping timer prevention; break persistence; midnight completion dates; backward clock changes; corrupt saves; streaks; diagonal speed; frame-rate independence; wall collision; and routes to every interaction.

## Browser checks still pending

- [ ] Open the local preview and enter Greenvale without an error or a permanent save warning.
- [ ] Walk with WASD and arrows. Confirm diagonal movement feels the same speed.
- [ ] Walk against walls, trees, water, and furniture. Check that the character does not clip through them.
- [ ] Enter Lantern House and return through the doorway. Check that the nearby prompt changes correctly.
- [ ] Read both villagers and each sign. Close dialogs with the button and Escape; resume movement.
- [ ] Start a session at the desk. Check that the apprentice sits, the timer counts down, and movement stops.
- [ ] Pause, reload, and resume. Check that paused time is preserved.
- [ ] Reload a running timer. Check that its deadline is preserved.
- [ ] Finish a real session. Record the before/after resources and reload to check that rewards are not duplicated.
- [ ] Take the suggested break. Watch the desk-to-bed route, sleep, and wake sequence.
- [ ] End a focus session early and confirm it earns no rewards. End a break early and confirm prior rewards remain.
- [ ] Open the game in a second tab. Confirm it cannot start a second session or write over the first. Close the first tab and confirm the second acquires the newest save.
- [ ] In a disposable browser profile, simulate unavailable storage and a malformed save. Confirm there is a readable warning and no silent replacement.
- [ ] Check desktop and phone widths, touch press-and-hold, keyboard focus outlines, and reduced ambient motion.
- [ ] Test the VS Code Run and Debug entry while the preview server is running.

Browser access was declined during the current development session. No browser checks above have been marked as passed.

## A first playtest for the project owner

Open the preview from VS Code’s terminal. Click Enter town. Walk left from the fountain, then up to Lantern House. Press E at its door, find the desk, and start 15 minutes. Pause it and reload once.

Write down three things: where you got lost, whether walking felt too slow or too fast, and one line of dialogue you would rewrite. Those observations belong in the journal; an invented playtest does not.

## Pixel interface and session-options checks

On 9 October 2026, the suite passed 41 tests and the production build passed. New automated coverage includes custom durations and their bounds, preserved selected breaks, legacy saves, empty days in the activity chart, year boundaries, and the twelve-minute world clock.

Still to playtest:
- [ ] Hide Controls, reload, and restore them from the top menu.
- [ ] Start 30 minutes with a custom 17-minute break; pause, reload, resume and verify the chosen break after completion.
- [ ] Start both a short and a long break; check that they award no focus rewards.
- [ ] Check invalid, empty and fractional minute inputs.
- [ ] Look at the village during day and night, and check the window sky indoors.
- [ ] Walk behind the larger trees, villagers and lamps, then focus and rest in the house.
- [ ] Check pixel-font readability and menu scrolling at desktop and phone widths.

These browser checks remain unverified.
