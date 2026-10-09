# Architecture

## Scene and interface

React owns session controls, dialogs, missions, purchases and the room roster. Canvas draws the 960 by 600 top-down world. A responsive camera follows the apprentice on narrow screens without changing world or collision coordinates. Focus and Town share timer controls, permissions and a blue-hour palette. VT323 and Silkscreen provide locally served pixel typography.

The engine runs movement outside React renders, normalizes diagonal movement and subdivides collision steps. Blur releases held keys. Objects are sorted by their ground position, including individual purchased flowers. Reduced motion stops ambient animation and companion interpolation. Cosmetic upgrades do not change collision. The northern fence, river and sealed eastern woods form a continuous barrier while the bridge is closed.

## Local progression

Pure transitions in src/game/state.ts and src/game/townProgress.ts own timers, purchases, missions, streaks and receipt application. Running timers retain an absolute device-clock deadline; paused timers retain their remaining duration. A Pomodoro plan captures its intervals and rounds when it begins. Automatic breaks start when completion is observed; focus always requires a click.

Discoveries, upgrades and claimed rewards are optional validated arrays in the existing version-one save. Older saves remain valid. The legacy localStorage key is retained. Purchases check coins and best streak, then deduct coins and record the upgrade together. Mission IDs and streak milestones prevent duplicate claims. Missing days do not remove purchases. Discovery interactions do not complete timers or mint coins.

useSave.ts requires an exclusive Web Lock and a valid save before ordinary writes. UI success follows successful persistence. A damaged save blocks ordinary updates but can be replaced with a valid backup after confirmation.

## Shared focus

Same-origin JSON endpoints validate request size, origin, types and rate limits. Invitations and membership capabilities are random; secrets are hashed in the database. A separate device profile secret is generated and saved locally before profile creation, so interrupted creation can recover the same identity. There is no account or cross-device identity recovery.

The writable tab reports local totals and upgrades. Reports use revision comparisons, and queued client work rechecks save ownership before sending or retrying. Reported totals are personal device data, not proof of study. Comparisons keep their existing leader through ties and change only after a strict overtake. Room snapshots include only relevant participants and the host's upgrades.

Everyone currently online must ready up before a shared focus start. A conditional room revision update freezes eligible profile IDs and creates a durable session. The host can pause, resume or cancel it. Explicit departure forfeits unfinished participation; temporary loss of presence does not. Closing a room cancels unfinished work after settling any already completed interval.

Server-issued receipts hold exact coins, energy and XP. Unique constraints prevent duplicate grants. Clients apply receipt and session history in one local save, then acknowledge receipt IDs. A failed acknowledgement can be retried safely. Earned receipts survive deletion of their room. Personal local timers are preserved when receipts arrive.

Companion coordinates are cosmetic, validated and sequenced. Town polls about once per second, Focus every four seconds, hidden tabs every twelve. Remote positions never affect collision or progression.

## Audio and hosting

One user-started audio element loops the chosen ambience. Track changes stop its predecessor. An optional second element plays completion chimes. Five credited CC0 recordings are bundled locally; no third-party audio host is contacted during playback. The Worker serves audio MIME types and byte ranges.

Drizzle migrations target local Node SQLite and hosted D1. Development data stays in the ignored .sites-runtime directory. Production handlers do not create schema. The build embeds static assets in a browser-compatible Worker, excluding Node SQLite. Known document routes return the app; unknown paths return a custom 404 with HTTP 404 status.

Automated tests cover transition rules, reachable interactions, the sealed forest, real SQLite room permissions, session concurrency, grant recovery and read-only profile behavior. Built Worker checks cover routing and audio responses. Browser layout, playback and two-device behavior remain owner playtests. The configured Site has not yet completed publication; a local invitation is not a public server.
