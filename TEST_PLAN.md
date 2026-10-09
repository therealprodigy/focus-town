# Owner playtest

Automated checks on 9 October 2026: 87 tests, TypeScript, production build, built Worker routing/audio checks and decoding of five sound files passed. The browser checks below are not marked complete. Record what you actually see.

## Open it

In VS Code, select **Run and Debug → Focus Town: start preview → Play**. If the preview is already running, use http://127.0.0.1:5173/ in Brave. Leave its terminal open.

## Start with the town

- [ ] Click Town. Walk with WASD or arrows; press E near an object. Try the touch controls too.
- [ ] Visit the reading bench, mailbox, tea stall and Miso. Dialogs should open and close without sticking a movement key.
- [ ] Use Take a tea break at Jun's stall. Short break settings should open while Town stays selected.
- [ ] Try going above the broken bridge and around the library. The visible fence and woods should stop you; the library door and bridge notice must remain reachable.
- [ ] Read the atlas and the shelf inside Lantern House. Investigate the bell. Discoveries should appear in Journal and survive a reload.
- [ ] Return to the pond and house window after nightfall. Check the twelve-minute light cycle; reduced motion should hold it still.
- [ ] Walk behind the new props and, after purchase, the moonflowers. Look for incorrect overlap or floating shadows.
- [ ] Compare Focus and Town at phone size, full screen and 200% zoom. The dock, clock and character should remain usable.

## Sessions and rewards

- [ ] Set focus, short break and long break to 1 minute with 2 rounds. Start, pause, reload, resume and finish.
- [ ] Confirm one Journal entry and one reward. Reload again; neither should duplicate.
- [ ] Finish both rounds. The final break should be labelled Long break. With automatic breaks enabled, the next focus still waits for Start.
- [ ] Open Missions. A completed mission pays once; an unfinished mission cannot be claimed.
- [ ] Visit Lottie. Unaffordable or streak-locked upgrades stay unavailable. Buy an available upgrade, check its scenery, then reload.
- [ ] After 25 completed minutes in a day, check the streak. Three- and seven-day bonuses should appear only once when reached through real sessions.

## Sound and saves

- [ ] Open Audio. Nothing should play until you click Play. Try all four tracks, volume, pause and switching tracks.
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
