# Focus Town

A small town for the thing you keep putting off. Pick a task, light the desk lamp, and give it one interval. Greenvale will still be here when you need a break.

       .--.
       |::|    GREENVALE
      _|__|_   one page at a time
        ||

## Play locally

Open this folder in VS Code. On a fresh checkout, use Node 26 or newer and run `npm install` in its integrated terminal. Choose **Run and Debug → Focus Town: start preview → Play**. If the server is already running, open [Focus Town](http://127.0.0.1:5173/) in Brave instead.

Keep the preview terminal open. A connection error usually means the preview has stopped; **Terminal → Run Task → Focus Town: start preview** starts it again. Do not start another copy if port 5173 is already occupied.

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

A localhost invitation works only on this Mac. Hosting must be live and accessible to both players before remote invitations work.

## Your save

Progress, settings, discoveries, purchases and journals live in this browser. Use **Settings → Export save** for a backup. Clearing browser data removes that copy and the device's co-op credential. Importing a save replaces local progress after confirmation; it does not restore a cleared co-op identity.

The old `focusraid-save-v1` storage key remains for save compatibility. One tab owns the writing lock. Shared rewards are acknowledged only after they have been saved locally. The server stores device profiles, reported totals, upgrades, room presence, comparisons and reward receipts. Task text stays local. See the in-game Privacy and Storage pages.

## Development

`npm test` checks game and server rules. `npm run build` checks TypeScript and builds the app and Worker. `node scripts/check-worker.mjs` checks the built document routes and audio delivery without opening a browser.

The 9 October 2026 build passed **103 automated tests**, both production builds and the Cloudflare deployment dry run. The earlier town upgrade also passed Worker checks and decoding checks for all five sound files. Visual layout, sound levels and two-device play remain for the owner to test using [TEST_PLAN.md](TEST_PLAN.md).

React, Vite, TypeScript, Tailwind, Canvas and SQLite/D1 power the game. [ARCHITECTURE.md](ARCHITECTURE.md) covers saving and co-op. [ASSETS.md](ASSETS.md) records artwork, fonts and the locally bundled CC0 sound library. Flocus informed timer hierarchy; its assets and code are not bundled.

Hackatime's local project name is now **Focus Town**. Historical project grouping in Pixl is separate from that setting and does not change previously recorded categories or hours.

## Public hosting

The Cloudflare adapter supports the full game and co-op backend on one address. [DEPLOYMENT.md](DEPLOYMENT.md) covers account setup, database migrations and publishing. Its packaging checks pass; account authorization and a live public deployment are still pending.
