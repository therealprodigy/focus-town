# Focus Town

[**Play Focus Town**](https://focus-town-greenvale.vercel.app) · [Download ZIP](https://github.com/therealprodigy/focus-town/archive/refs/heads/main.zip) · [Development journal](DEVLOG.md)

A small town for the thing you keep putting off. Pick a task, light the desk lamp, and give it one interval. Greenvale will still be here when you need a break.

       .--.
       |::|    GREENVALE
      _|__|_   one page at a time
        ||

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

Greenvale has a reading bench, a tea stall, a rather unhelpful mailbox, Miso the cat, and a library atlas with something pencilled in the margin. Some discoveries need nightfall. The twelve-minute day/night cycle shares the observatory's blue-hour palette; reduced motion keeps the scene still.

Finish sessions and claim noticeboard missions to earn coins. Lottie's shop sells porch lanterns, moonflower beds, a fountain repair and festival bunting. Purchases visibly change the village and stay bought after a missed day. A streak day needs 25 completed focus minutes; reaching your first three- and seven-day streaks pays a one-time bonus.

The forest and library interior are closed. The broken bridge cannot be bypassed. Combat and equipment are not implemented.

## Bring a friend

Open **Together**, choose a nickname and create a room. Send its invitation to someone who can access the same hosted site. Up to eight people can join. Everyone who is online must ready up before the host starts focus. The host controls the timer; each ready participant receives a saved completion receipt. A temporary disconnect keeps eligibility, while explicitly leaving forfeits an unfinished interval.

Guests see the host's village upgrades. Recorded focus minutes and best streaks appear beside friends. The lower total gets the playful **mogged** tag; a tie preserves the existing lead until the other player overtakes it. These are self-reported device totals, not verified study records.

Rooms expire after 24 hours. Earned receipts survive room expiry and are collected when the same browser reconnects. Personal saves do not sync between devices. Town presence updates about once per second: this is a shared study space, not fast-action multiplayer.

Use the public Play link for remote invitations. A localhost invitation works only on the computer running that local copy.

## Your save

Choose a character name in **Settings** or click **Name your character** in Town. Your name, sessions, discoveries, purchases and journal progress save automatically in this browser.

**Settings → Download progress backup** makes a portable copy of that progress. On another device, open the public game and choose **Import progress**. Importing replaces that browser's progress after confirmation and is blocked during a session or room visit. Timer preferences and online identity are not included.

Settings shows the current save status and website address. A recovery copy is kept beside the main save. If the main copy is damaged, you can review the recovery copy before restoring it. Clearing site data removes both copies and the device's co-op credential. Keep a downloaded backup; the recovery copy is not cloud storage.

The old `focusraid-save-v1` storage key remains for save compatibility. One tab owns the writing lock. Shared rewards are acknowledged only after they have been saved locally. The server stores device profiles, reported totals, upgrades, room presence, comparisons and reward receipts. Task text stays local. See the in-game Privacy and Storage pages.

## Development

`npm test` checks game and server rules. `npm run build` checks TypeScript and builds the app and Worker. `node scripts/check-worker.mjs` checks the built document routes and audio delivery without opening a browser.

The latest local checks on 9 October 2026 passed **121 automated tests**, both production builds and the built Worker route/audio checks. The eight new tests cover character-name compatibility and save recovery without duplicate rewards. The previous deployment also passed 22 existing room and reward tests against the libSQL adapter. Its public checks passed for the custom 404, audio range delivery, room invitations, timer synchronization, host permissions, reward acknowledgements and mogging ties/overtakes. The earlier town upgrade also passed Worker checks and decoding checks for all five sound files. Visual layout, sound levels and two-device play remain for the owner to test using [TEST_PLAN.md](TEST_PLAN.md).

React, Vite, TypeScript, Tailwind and Canvas power the game. Local development uses SQLite; the public shared-room service uses Turso/libSQL. A Cloudflare D1 adapter is also available. [ARCHITECTURE.md](ARCHITECTURE.md) covers saving and co-op. [ASSETS.md](ASSETS.md) records artwork, fonts and the locally bundled CC0 sound library. Flocus informed timer hierarchy; its assets and code are not bundled.

Hackatime's local project name is now **Focus Town**. Historical project grouping in Pixl is separate from that setting and does not change previously recorded categories or hours.

## Public hosting

The public game runs on Vercel with a Turso database for shared rooms. Both were configured on their free plans. [DEPLOYMENT.md](DEPLOYMENT.md) covers updates, migrations and the optional Cloudflare adapter. GitHub pushes do not automatically deploy yet; publishing currently uses the Vercel CLI.
