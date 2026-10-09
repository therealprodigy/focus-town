# Focus Town

[**Play Focus Town**](https://focus-town-greenvale.vercel.app) · [Download ZIP](https://github.com/therealprodigy/focus-town/archive/refs/heads/main.zip) · [Development journal](DEVLOG.md)

A small town for the thing you keep putting off. Pick a task, light the desk lamp, and give it one interval. Greenvale will still be here when you need a break.

       .--.
       |::|    GREENVALE
      _|__|_   one page at a time
        ||

## Download and play locally

[**Download Focus Town ZIP**](https://github.com/therealprodigy/focus-town/archive/refs/heads/main.zip)

For Windows, macOS or Linux, install [Node.js 24 or newer](https://nodejs.org/en/download) and [Git](https://git-scm.com/downloads) first. Paste the matching block into a terminal in the folder where you want to keep the game. It downloads the project, installs its dependencies and opens the game in your browser.

**Mac or Linux**

```sh
git clone https://github.com/therealprodigy/focus-town.git "focus-town" && cd "focus-town" && npm ci && npm run dev -- --strictPort --open
```

**Windows PowerShell**

```powershell
git clone https://github.com/therealprodigy/focus-town.git "focus-town"
if ($LASTEXITCODE -ne 0) { throw "Download failed. Check Git and choose a folder without an existing focus-town directory." }
Set-Location -LiteralPath "focus-town" -ErrorAction Stop
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw "Setup failed. Check the error above and your Node.js version." }
npm.cmd run dev -- --strictPort --open
```

Leave the terminal open while playing. If the browser does not open, visit the local address printed by Vite. Press **Ctrl+C** in the terminal to stop it. If port 5173 is already occupied by Focus Town, use the running copy.

**Downloaded the ZIP?** Extract it, open a terminal inside the extracted folder and run `npm install`, then `npm run dev -- --strictPort --open`. In Windows PowerShell, use `npm.cmd` instead of `npm` if script execution is restricted. The ZIP route does not require Git. To play again, open the same folder and run the second command.

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

Progress, settings, discoveries, purchases and journals live in this browser. Use **Settings → Export save** for a backup. Clearing browser data removes that copy and the device's co-op credential. Importing a save replaces local progress after confirmation; it does not restore a cleared co-op identity.

The old `focusraid-save-v1` storage key remains for save compatibility. One tab owns the writing lock. Shared rewards are acknowledged only after they have been saved locally. The server stores device profiles, reported totals, upgrades, room presence, comparisons and reward receipts. Task text stays local. See the in-game Privacy and Storage pages.

## Development

`npm test` checks game and server rules. `npm run build` checks TypeScript and builds the app and Worker. `node scripts/check-worker.mjs` checks the built document routes and audio delivery without opening a browser.

The 9 October 2026 build passed **113 automated tests**. Another run passed 22 existing room and reward tests against the libSQL adapter. The production build and Vercel deployment succeeded. Public checks passed for the custom 404, audio range delivery, room invitations, timer synchronization, host permissions, reward acknowledgements and mogging ties/overtakes. The earlier town upgrade also passed Worker checks and decoding checks for all five sound files. Visual layout, sound levels and two-device play remain for the owner to test using [TEST_PLAN.md](TEST_PLAN.md).

React, Vite, TypeScript, Tailwind and Canvas power the game. Local development uses SQLite; the public shared-room service uses Turso/libSQL. A Cloudflare D1 adapter is also available. [ARCHITECTURE.md](ARCHITECTURE.md) covers saving and co-op. [ASSETS.md](ASSETS.md) records artwork, fonts and the locally bundled CC0 sound library. Flocus informed timer hierarchy; its assets and code are not bundled.

Hackatime's local project name is now **Focus Town**. Historical project grouping in Pixl is separate from that setting and does not change previously recorded categories or hours.

## Public hosting

The public game runs on Vercel with a Turso database for shared rooms. Both were configured on their free plans. [DEPLOYMENT.md](DEPLOYMENT.md) covers updates, migrations and the optional Cloudflare adapter. GitHub pushes do not automatically deploy yet; publishing currently uses the Vercel CLI.
