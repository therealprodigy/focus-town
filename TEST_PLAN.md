# Owner playtest

Automated checks on 10 October 2026: 154 tests, TypeScript, both production builds and built Worker route/audio checks passed. The browser checks below are not marked complete. Record what you actually see.

## Open it

In VS Code, select **Run and Debug → Focus Town: start preview → Play**. If the preview is already running, use http://127.0.0.1:5173/ in Brave. Leave its terminal open.

## Start with the town

- [ ] Click Town. Walk with WASD or arrows; press E near an object. Try the touch controls too.
- [ ] Visit the reading bench, mailbox, tea stall and Miso. Dialogs should open and close without sticking a movement key.
- [ ] Use Take a tea break at Jun's stall. Short break settings should open while Town stays selected.
- [ ] Try going above the broken bridge and around the library. The visible fence and woods should stop you; the library door and bridge notice must remain reachable.
- [ ] Read the atlas and the shelf inside Lantern House. Investigate the bell. Discoveries should appear in Journal and survive a reload.
- [ ] Return to the pond and house window after nightfall. Check the twelve-minute light cycle; reduced motion should stop decorative movement while the town clock continues.
- [ ] Walk behind the new props and, after purchase, the moonflowers. Look for incorrect overlap or floating shadows.
- [ ] Compare Focus and Town at phone size, full screen and 200% zoom. The dock, clock and character should remain usable.

## Sessions and rewards

- [ ] Set focus, short break and long break to 1 minute with 2 rounds. Start, pause, reload, resume and finish.
- [ ] Confirm one Journal entry and one reward. Reload again; neither should duplicate.
- [ ] Finish both rounds. The final break should be labelled Long break. With automatic breaks enabled, the next focus still waits for Start.
- [ ] Open Missions. A completed mission pays once; an unfinished mission cannot be claimed.
- [ ] Visit Lottie. Unaffordable or streak-locked upgrades stay unavailable. Buy an available upgrade, check its scenery, then reload.
- [ ] After 25 completed minutes in a day, check the streak. Three-, seven-, fourteen- and thirty-day bonuses should appear only once when reached through real sessions.

## Sound and saves

- [ ] Open Audio. Nothing should play until you click Play. Try all seven sounds, volume, pause and switching tracks.
- [ ] Enable the completion chime and test it. Finish a short focus session and listen for one chime. Note harsh volume changes or loop clicks.
- [ ] Export a save. Import it only after checking the replacement confirmation. Invalid JSON must leave existing progress intact.
- [ ] Open a second tab. It should not write personal progress, claim rewards or create/join rooms while the first tab owns the save.
- [ ] Hide and restore controls, use keyboard navigation in dialogs, and press Escape to close them.
- [ ] Visit Privacy, Storage & cookies, Terms and an unknown address.

## Two players

Use two browser profiles or devices with access to the same running server. A localhost link works only on this Mac. Remote play needs a published accessible host.

- [ ] Create and join a room. Check names and host village upgrades on both sides.
- [ ] Start remains unavailable until both players ready up. Guests cannot control the timer.
- [ ] Finish a one-minute focus interval. Both players receive one receipt and one Journal entry; shared room minutes increase once.
- [ ] Reload after completion. Rewards must not repeat. Start a break; it should not promise focus rewards.
- [ ] Disconnect a ready guest during focus, finish, then reconnect. The earned receipt should be collected.
- [ ] Explicitly leave before a different interval ends. That unfinished interval should not reward the departing guest.
- [ ] Compare totals. A tie preserves the existing mogged tag; strictly overtaking flips it.
- [ ] Close as host. A failed server request should keep the room credentials available for retry.

## Report a bug

Write what you clicked, what you expected, what happened, your browser/device, and whether reloading changes it. A screenshot helps with layout. Keep private saves and invitation secrets out of public issues. Journal only the testing you actually did.

## Final name and backup check

Save a name in Settings, visit Town and reload. Download a progress backup, then import it into an idle copy in another browser and compare names, sessions and coins. Timer preferences and online identity do not transfer. Import must remain disabled during a session or room visit.

## The Old Crossing update

- [ ] In Settings, choose a name, coat, skin tone and headwear. Reload; the same character should return. A room companion should see the chosen outfit.
- [ ] Switch among Living sky, Local time, Always daylight and Always evening. The displayed clock, sky and night discoveries should agree. Turn on reduced motion and speak to Rowan and Mira; the interaction prompt must stay beside them.
- [ ] Before repairs, try crossing above the library and away from the bridge. The east bank must stay closed.
- [ ] Buy the crossing stages in order. Each price deducts coins and energy once. Only the final stage opens the route. Reload and walk to the glasshouse, telescope, bench, workbench and orchard cat.
- [ ] Buy coffee for 6 coins while idle. Walking should become faster; the expiry is thirty real minutes, including pauses. A 25-minute solo session entirely inside that window awards 15 coins instead of 12. Coffee never stacks, rewards breaks or multiplies a shared receipt.
- [ ] While visiting a host with the bridge repaired, walk across. Leave that room with your own bridge still broken. The player should return safely to the west bank.
- [ ] View Focus and Town at narrow portrait size, short landscape size, full screen and 200% zoom. Check the opaque timer, dock and character name for overlap. Make sure the revised house and shop details do not cover their doors.
- [ ] Set encouragement to Off, then try the other three styles. Lines should stay out of the way during an active session.

## Clockworks redesign

- [ ] On a fresh save, use the five-page guide, skip it, reload and replay it in Settings. It must not replace an open menu or a shared room.
- [ ] Compare the three desk lighting options and flip/plain clocks. Try 1, 25 and 720 minutes, reduced motion and a short phone viewport.
- [ ] Visit the oak-floored house. Walk to the blue poster, desk, bed and fireplace. The hearth must block movement without blocking those interactions.
- [ ] Switch rapidly between recordings and ambient sounds while loading, then cancel. Only the latest sound should play. Check volume, pauses and loop seams by ear.
- [ ] Enable the chime, reload a save with a past completion and listen: that old completion must stay silent. A newly finished session should chime once.

The six new regression tests cover clock labels and long durations, house reachability/collision, discovery save compatibility and audio-node disposal. Rendered layout and listening tests were not performed because the saved preview permission blocked browser access.

## Personal desk manual pass

- Try all three backgrounds, finishes and sizes at 320px width and a short desktop window. Check plain digits and 720-minute sessions too.
- Collapse a running solo timer; pause, expand and reload. Confirm its deadline and progress are preserved. Repeat with a shared room as host and guest.
- Reload after changing desk options. Reset the desk and confirm session lengths, character and rewards remain unchanged.
- Replay the guide. Enter an invalid name, save a valid one, choose a task, reach the practice sign with keys and touch controls, then skip or finish. Real progress must not change during practice.
- Check glass with reduced transparency and high contrast enabled. Paper and garden labels must remain readable.

These browser checks have not been completed by the agent; the saved preview rule blocks access.
