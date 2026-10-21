# Owner playtest

Automated checks on 10 October 2026: 173 tests, TypeScript and both production builds passed. Built Worker route/audio checks passed on the earlier clockworks build. The browser checks below are not marked complete. Record what you actually see.

## Open it

In VS Code, select **Run and Debug → Focus Street: start preview → Play**. If the preview is already running, use http://127.0.0.1:5173/ in Brave. Leave its terminal open.

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

## Save handoff and tutorial follow-up

- [ ] Open the same public game in two tabs. In the second, choose Use this tab. Confirm the warning clears, the saved timer continues, and only the second tab can change progress. Switch back.
- [ ] Dismiss the tab notice. Confirm Use this tab remains beside the timer and in Settings. Repeat with three tabs open.
- [ ] Keep an older game tab open, then request the save from the new version. Follow the close-tab hint; progress must remain intact without clearing storage.
- [ ] In the guide, tap the panel padding and backdrop. Neither should skip the tour. Close, Skip and Escape should still work.
- [ ] Scroll to the bottom of a guide page, then choose Next or Back. Confirm the heading becomes visible and receives keyboard focus. Enter a name and choose Next; return to confirm it saved.

The twelve controller tests use a deterministic browser-lock model. They verify that aborting a granted request does not release its lock; the old holder must explicitly finish first. They are not a substitute for the browser checks above.

## Glass and scenery final pass

The 12 October update passed 183 automated tests, both production builds and built Worker route, image and audio checks. The image files were visually inspected; the rendered interface was not, because browser access was denied.

- [ ] Open Scenery & clock, then Scenery. Try Observatory, Library window and Garden morning with each Light option. Reload and confirm the chosen scene remains.
- [ ] Compare the Focus/Town switch in both views at desktop width and 320px. Its centre should stay on the window's centre, even when the side labels are hidden.
- [ ] Collapse an idle, running and paused timer. Check the short glass strip, Start/Pause/Resume and Expand. End a two-round plan: old completion text should appear only in the full view.
- [ ] Try 720 minutes, large digits, and a 640 by 360 window. Check that the clock stays inside the pane and the town timer does not cover movement controls.
- [ ] In compact mode, check Use this tab and shared-room readiness. A guest should still see that the host controls the timer. Tab through the strip: no hidden dismiss button should receive focus.
- [ ] Enable reduced transparency or high contrast in the operating system. The timer should remain readable without a blur effect.

## Cherrybank release pass

Automated checks: 201 tests pass, including all new interactions reachable by route search, all unfinished crossing stages blocked, fountain water/depth, camera extents, new room bounds, quest prerequisites, invalid puzzle choices, one-time claims and earned equipment in backups. Both production builds and Worker asset checks passed. The following are still manual checks, not completed playtest claims.

- [ ] Find the cherry-stamped letter southwest of the fountain. Open Quests, collect the first request and check the compass direction. Read the letter again; no second reward should appear.
- [ ] With the Old Crossing repaired, walk east through the glasshouse garden into Cherrybank. Find all three residents, the reel, ticket and star chart. Walk behind and in front of trees, lamps, kiosk and cinema props.
- [ ] Inspect the reel and ticket, collect Pip’s missing ending, then speak to Oren. Try a wrong scene and then Nightfall. The puzzle should save once. Open Pip’s projector, try all three films, Previous, Next and Roll credits.
- [ ] Progress through the requests using completed focus sessions. Equip the earned crown and cloak in Settings; reload and export/import a backup. The same outfit and claims should return.
- [ ] Join a friend with a repaired crossing while your own crossing is closed. The compass should direct you through their town. A companion with no saved outfit should not inherit your crown or cloak.
- [ ] Check the fountain before and after restoration. Water should be visible in both states. Reduced motion should leave still water and petals without stopping the study clock.
- [ ] At 320px, check the quest tabs, puzzle choices and film selector. Use the keyboard to change pages and close NPC conversations. Check that the portrait matches the resident outside.


## Focus Street follow-up, 21 October

218 automated checks pass, including profile handoff, late shared-grant retrieval, missing primary save with damaged or inaccessible recovery, prop collision, book occlusion and interval progress. Source review also covers the appearance panel and shared readiness controls.

- [ ] Open Scenery & clock from Focus and Settings. Change lighting, scene and finish, close, reload and confirm persistence. A running timer must continue.
- [ ] On a phone, hide the keyboard hint and walk using the direction buttons. Drag a pressed finger away, switch views and return; movement must stop after release.
- [ ] Visit Town. Open and fold its timer; the closed header must keep the countdown visible.
- [ ] In a room, open Sessions before every member is ready. Start must be disabled there and on the main timer. Ready up in Together, then start as host.
- [ ] Switch save ownership between tabs after changing progress or restoring a backup. Confirm the friend-facing profile catches up without duplicate shared rewards.
- [ ] Behind a foreground tree, wait for the reading animation. Both traveller and book should be occluded together. Try walking through the garden props from each side.

These manual checks remain pending. Automated tests do not establish visual quality or real-device behavior.
