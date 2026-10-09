# Owner playtest

Automated baseline on 9 October 2026: 65 tests and the production build passed. These checks are still for the owner to perform in a browser. Record what you actually observe, including failures.

## Open the game

1. In VS Code, click Run and Debug on the left.
2. Choose Focus Town: start preview and click the green play button.
3. If the preview is already running, open http://127.0.0.1:5173/ in Brave.
4. Keep VS Code's preview terminal open. Do not start a second copy if port 5173 is in use.

## First ten minutes

- [ ] Resize the window. Check that the clock, Start button and bottom dock remain visible, including at phone size and browser zoom 200%.
- [ ] Click the dock's full-screen corners icon. Press Escape to return.
- [ ] Open Sessions. Set focus, short break and long break to 1 minute, with 2 rounds. Start.
- [ ] Pause after a few seconds, reload, and check that it remains paused. Resume and wait for completion.
- [ ] Check that one session appears in Journal, with one reward. Reload again and check it is not duplicated.
- [ ] Finish the short break, start round two, then check the final break is labelled Long break even though both breaks are 1 minute.
- [ ] Try automatic breaks. Confirm the next focus round still waits for Start.

## Town refresh

- [ ] Switch between Focus and Town. Compare their colours and lighting; record anything that feels out of place.
- [ ] In Town, click Set sessions. Choose custom focus, short break, long break and rounds. Save settings; Town should stay open.
- [ ] Start a one-minute interval from Town, then pause and resume. The apprentice should study in Lantern House while the town timer remains usable.
- [ ] Complete the interval and take a break. Check the next-round action and the saved result without visiting Focus.
- [ ] Hide and reopen the timer. On a short phone screen it starts collapsed; make sure the expanded controls leave room to see the character.
- [ ] Walk to all map edges on a phone and a wide screen. The whole character should stay visible. Resizing should not move the character to a different map position.
- [ ] Read the atlas outside the library and inspect the bell south of the square. Walk behind both and check their drawing order.
- [ ] Talk to Mira and open the journal. Close it, then continue walking.
- [ ] As co-op host, clear a duration field. Start should be disabled until it is valid. Guests must not gain timer control.

## Explore

- [ ] Click Town, click the game and use WASD or arrow keys. Enter Lantern House and talk to Rowan or Mira outside.
- [ ] Hide movement controls; restore them in Settings.
- [ ] On a touch device, check each movement button releases after lifting or cancelling a touch.
- [ ] Check the day/night cycle, foreground depth and larger character silhouette.
- [ ] Open a dialog with the keyboard. Tab through it, close it with Escape, and continue moving.
- [ ] Turn on Reduce motion. Check that ambient movement stops.

## Saves

- [ ] Export a save. End any session and import the exported file; check the replacement confirmation before restoring.
- [ ] Check the same save in a second tab. Only one tab should be allowed to change personal progress.
- [ ] Try invalid JSON and an unrelated file. The existing save must remain intact.
- [ ] Read Privacy and Storage & cookies. Check an unknown address shows the custom 404 and a return link.

## Two-player check

Use two browser sessions with access to the same Site. A localhost link is only for this Mac; a private Site invitation does not grant hosting access.

- [ ] Host creates a room; guest joins with its invitation. Both see the two names.
- [ ] Both enter Town. Walk and change rooms; companions should appear only in the same scene.
- [ ] Host starts a 1-minute interval. Guest sees it and cannot control it.
- [ ] Pause, resume and complete it. Shared minutes should increase by one, once; the beacon should light.
- [ ] Disconnect the guest and leave locally. Solo focus should remain available.
- [ ] Disconnect the host and try Close room. It should show a failure and keep retry access.
- [ ] Reconnect and close as host. Guest should return to solo when the closed room is detected.

## Write a useful bug report

Use: what you clicked, what you expected, what happened, browser/device and whether a reload changes it. Include a screenshot if the layout is wrong. Do not include room secrets or private save files in a public issue.

These observations are the human part of the journal. Do not mark unchecked items as passed or invent time spent testing.
