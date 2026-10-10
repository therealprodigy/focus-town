# Focus Town

[**Play Focus Town**](https://focus-town-greenvale.vercel.app) · [Download ZIP](https://github.com/therealprodigy/focus-town/archive/refs/heads/main.zip) · [Development journal](DEVLOG.md)

A small town for the thing you keep putting off. Pick a task, light the desk lamp, and give it one interval. Greenvale will still be here when you need a break.

       .--.
       |::|    GREENVALE
      _|__|_   one page at a time
        ||

> Release status: the public Play link now includes the Old Crossing expansion and the warmer Clockworks redesign. Automated checks pass. Browser layout, sound levels and a real two-device playtest still need a manual pass; see TEST_PLAN.md.

Choose **Arrange your desk** to switch between the observatory, an illustrated garden morning and a quiet paper desk. Pick a walnut, porcelain or terracotta clock, change its size, or hide the task and encouragement. **Collapse timer** keeps the countdown and session controls in a small panel. Desk choices save in this browser and do not change a running session.

The first-visit guide lets you choose a name, set a task and practise walking to a sign with the keyboard or touch buttons. Replay it from **Settings → New here? Take the town tour**. Practice does not award coins or alter the town.

## Play now

Open [Focus Town](https://focus-town-greenvale.vercel.app) on a phone, tablet or computer. No account, terminal or download is needed. This is the easiest way to play with friends.

## Run your own desktop copy

[**Download Focus Town ZIP**](https://github.com/therealprodigy/focus-town/archive/refs/heads/main.zip)

For Windows, macOS or Linux, install [Node.js 24 or newer](https://nodejs.org/en/download) and [Git](https://git-scm.com/downloads) first. Paste the matching block into a terminal in the folder where you want to keep the game. It downloads the project, installs its dependencies and opens the game in your browser.

**Mac or Linux**

```sh
git clone https://github.com/therealprodigy/focus-town.git "focus-town" && cd "focus-town" && npm start
```

**Windows PowerShell**

```powershell
git clone https://github.com/therealprodigy/focus-town.git "focus-town"
if ($LASTEXITCODE -ne 0) { throw "Download failed. Check Git and choose a folder without an existing focus-town directory." }
Set-Location -LiteralPath "focus-town" -ErrorAction Stop
npm.cmd start
```

Leave the terminal open while playing. If the browser does not open, visit the local address printed by Vite. Press **Ctrl+C** in the terminal to stop it. If port 5173 is already occupied by Focus Town, use the running copy.

**Downloaded the ZIP?** It contains source code, not a standalone app. Install Node.js 24 or newer, extract the ZIP, open the extracted folder in VS Code and choose **Terminal → New Terminal**. Run `npm start` (`npm.cmd start` in Windows PowerShell). The first run installs dependencies and opens the game. Use the same command next time. No Git is needed for this route.

**Phones and tablets:** open [Play Focus Town](https://focus-town-greenvale.vercel.app). No terminal or installation is needed. The commands above are for running your own desktop copy.

## Run and debug in VS Code

Open the downloaded folder in VS Code, then choose **Run and Debug → Focus Town: start preview → Play**. If the server is already running, open the local address printed in its terminal.

A connection error usually means the preview stopped. **Terminal → Run Task → Focus Town: start preview** starts it again. Keep that terminal open and avoid starting another copy on port 5173.

## One page, then a walk

**Sessions** sets focus, short break and long break durations from 1 to 720 minutes. Choose a preset or a custom plan of up to 12 rounds. The last round ends with a long break. Automatic breaks are optional; the next focus interval waits for you.

**Town** opens the top-down village. Move with WASD or arrow keys, press E to interact, or use the touch controls. The dock includes full screen, audio, missions and settings. Controls can be hidden. The town desk and Jun's tea stall open session choices without sending you back to Focus.

Repair the Old Crossing in three stages to reach Whispering Garden: a glasshouse, orchard, reading bench, workbench and copper telescope. Repairs use 55 coins and 100 energy in total and stay built. The river remains impassable away from the repaired bridge. The library interior is still closed.

Lottie's catalogue also sells porch lanterns, moonflowers, a fountain repair and festival bunting. Ten noticeboard missions reward completed sessions, discoveries, repairs and streaks. A streak day needs 25 completed focus minutes. The first 3-, 7-, 14- and 30-day records each pay a bonus; missing a day never removes a purchased upgrade.

Jun's coffee costs 6 coins. For 30 real minutes it increases walking speed by 35% and adds up to 25% to solo focus coins, rounded down and only for the part of the interval covered by coffee. Pauses use up the coffee's time without earning a bonus. Buy before starting a session. Coffee cannot stack and does not multiply shared-room rewards.

**Settings** includes six coats, four skin tones and three headwear choices. Town lighting can follow the twelve-minute day, your local time, permanent daylight or evening. The town clock and night discoveries use the same setting. Reduced motion stops decorative movement while the clock keeps working. Choose gentle, direct or playful encouragement, or turn it off.

**First visit** offers a five-step town guide. Replay it from Settings. On Focus, open **Arrange your desk** to choose Lamplight, Moonlight or Ink, plus the split-flap clock or plain digits. The listening shelf now has seven choices: four recordings and three original ambient loops. Sound starts only when you press Play.

Looking for the hidden details? [The spoiler guide](SECRETS.md) lists where to find them.

## Bring a friend

Open **Together**, choose a nickname and create a room. Send its invitation to someone who can access the same hosted site. Up to eight people can join. Everyone who is online must ready up before the host starts focus. The host controls the timer; each ready participant receives a saved completion receipt. A temporary disconnect keeps eligibility, while explicitly leaving forfeits an unfinished interval.

Guests see the host's village upgrades and crossing repairs. Your own upgrades return when you leave. Chosen outfits travel with companions. Recorded focus minutes and best streaks appear beside friends. The lower total gets the playful **mogged** tag; a tie preserves the existing lead until the other player overtakes it. These are self-reported device totals, not verified study records.

Rooms expire after 24 hours. Earned receipts survive room expiry and are collected when the same browser reconnects. Personal saves do not sync between devices. Town presence updates about once per second: this is a shared study space, not fast-action multiplayer.

Use the public Play link for remote invitations. A localhost invitation works only on the computer running that local copy.

## Your save

If another Focus Town tab has your save open, choose **Use this tab** beside the timer or in Settings. Your saved timer and progress move over; the other tab becomes read-only. You can dismiss the notice without losing that option. An older tab may not understand the switch request: close other Focus Town tabs once, then the waiting tab opens your save automatically. Do not clear site data to fix this message.

Choose a character name in **Settings** or click **Name your character** in Town. Your name, appearance, lighting, encouragement setting, coffee expiry, sessions, discoveries, purchases and journal progress save automatically in this browser. The save status in Settings reports whether the write succeeded.

**Settings → Download progress backup** makes a portable copy of that progress. On another device, open the public game and choose **Import progress**. Importing replaces that browser's progress after confirmation and is blocked during a session or room visit. Timer preferences and online identity are not included.

Settings shows the current save status and website address. A recovery copy is kept beside the main save. If the main copy is damaged, you can review the recovery copy before restoring it. Clearing site data removes both copies and the device's co-op credential. Keep a downloaded backup; the recovery copy is not cloud storage.

The old `focusraid-save-v1` storage key remains for save compatibility. One tab owns the writing lock. Shared rewards are acknowledged only after they have been saved locally. The server stores device profiles, reported totals, upgrades, room presence, comparisons and reward receipts. Task text stays local. See the in-game Privacy and Storage pages.

## Development

`npm test` checks game and server rules. `npm run build` checks TypeScript and builds the app and Worker. `node scripts/check-worker.mjs` checks the built document routes and audio delivery without opening a browser.

The release checks and remaining manual checks are recorded in [TEST_PLAN.md](TEST_PLAN.md). Automated tests cover timers, save recovery, room authorization, rewards, appearance, repair prerequisites, expanded map reachability and coffee accounting. A passing build does not verify the visual layout or two-device experience.

React, Vite, TypeScript, Tailwind and Canvas power the game. Local development uses SQLite; the public shared-room service uses Turso/libSQL. A Cloudflare D1 adapter is also available. [ARCHITECTURE.md](ARCHITECTURE.md) covers saving and co-op. [ASSETS.md](ASSETS.md) records artwork, fonts and the locally bundled CC0 sound library. Flocus informed timer hierarchy; its assets and code are not bundled.

Hackatime's local project name is now **Focus Town**. Historical project grouping in Pixl is separate from that setting and does not change previously recorded categories or hours.

## Public hosting

The public game runs on Vercel with a Turso database for shared rooms. Both were configured on their free plans. [DEPLOYMENT.md](DEPLOYMENT.md) covers updates, migrations and the optional Cloudflare adapter. GitHub pushes do not automatically deploy yet; publishing currently uses the Vercel CLI.
