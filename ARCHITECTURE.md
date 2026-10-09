# Architecture

## Interface and town

React owns the timer, settings, accessible dialogs and room roster. Tailwind and shared Radix/CVA button primitives support the interface. Focus uses an original static observatory illustration; Town uses a 960 by 600 Canvas world scaled to the available window. All fonts are served locally.

The engine keeps movement outside React renders, normalizes diagonal speed, subdivides collision steps and releases held keys on blur. World objects are drawn in ground-position order. Reduced motion stops ambient animation and companion interpolation.

## Personal timers

Pure transitions in src/game/state.ts own durations, Pomodoro plans, rewards and streaks. A running timer has an absolute device-clock deadline. A paused focus or break keeps its remaining duration. A plan captures its intervals and round count when it begins. The final round leads to a long break. Automatic breaks begin when completion is observed; a new focus round always requires a click.

Completion and rewards form one save envelope. Completed IDs prevent duplicate rewards. useSave.ts acquires an exclusive Web Lock before writing localStorage. Ordinary updates require a valid existing save; explicit backup restoration requires the lock but can recover damaged data. UI state updates only after persistence succeeds. The legacy save key is retained through the Focus Town rename.

## Shared rooms

The browser posts same-origin JSON to server/room-service.ts. A host creates an eight-person room and receives a random invitation plus a separate membership capability. Membership secrets and invitation secrets are hashed in storage. Room access expires after 24 hours. Guests may leave locally if disconnected; host closure keeps credentials until the server confirms deletion.

The server validates bodies and origin, authenticates every room operation, applies request limits, and allows only the host to change intervals. Revision comparisons and conditional SQL updates prevent competing controls or polls from settling a session twice. Shared focus contributes minutes once per completed interval, not once per member. It never changes personal rewards.

Companion positions are cosmetic. Coordinates and enum values are validated; membership identity comes from authentication, not submitted player IDs. Per-member sequences reject stale position updates. Visible Town polls approximately once per second; Focus polls every four seconds; hidden tabs poll every twelve seconds. Only online companions with recent positions in the same scene are rendered. Scene changes snap, ordinary motion interpolates, and overlapping companions are grouped by name/count. Positions never affect collision, rewards or progression.

## Storage and hosting

Drizzle schema definitions in db/schema.ts generate SQL migrations. Hosted D1 runs prepared queries; production requests never create schema. The Vite plugin supplies an equivalent SQLite adapter for local development using Node 26. Its ignored database is .sites-runtime/focus-town.sqlite.

The build bundles the React app, then creates a browser-compatible Worker containing static assets and the room handler. Local Node SQLite code is excluded from the Worker. Known document routes return the app; unknown routes return the app with HTTP 404. The archive includes hosting metadata and Drizzle migrations. The initial Site remains owner-private; game invitations do not grant Site access.

No music, combat, shop inventory or personal cloud account is implemented. Automated tests exercise the rules and real SQLite handler; they do not establish visual quality or real-device behavior.
