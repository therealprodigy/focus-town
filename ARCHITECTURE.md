# Architecture

## Two layers

Canvas draws the world at a fixed 960 × 600 resolution. React owns the menus, notebook, buttons, and timer text. This keeps movement independent of React renders and gives dialogs normal browser focus handling.

`world.ts` defines each room, solid objects, spawn points, and interaction areas. The player collides using a small rectangle at their feet. Artwork can extend above that rectangle. `engine.ts` normalizes diagonal movement, splits movement into short collision steps, and clears held keys when focus leaves the game.

`renderer.ts` draws the environment and original pixel characters. Objects are ordered by their ground position so the apprentice can walk behind scenery. Ambient motion can be turned off.

## Timer and save rules

`state.ts` contains pure transitions. A running timer stores an absolute deadline. A paused focus timer stores remaining time. Completing a focus session adds the session record and rewards in one save object; completing a break only removes its timer. Session IDs prevent a completed session being claimed twice.

A session is recorded on the local calendar date of its deadline, even when it is settled after a later reload. Streaks require 25 completed minutes per local day. This uses the device clock and is not a tamper-proof time-tracking system.

`App.tsx` holds an exclusive Web Lock while it can write the save. Pending locks are abortable so React development remounts do not leave the game read-only. Another tab may wait for ownership; it reloads the newest save after acquiring the lock.

Changes are applied to the displayed save only after localStorage accepts the full envelope. A storage failure leaves the previous state in place and shows a warning. Malformed or unsupported saves are not overwritten.

## Boundaries

There is no backend, authentication, cloud sync, combat engine, shop inventory, or authoritative clock. Keep those out of the first two rooms until a milestone needs them. The React/Canvas integration still needs browser testing; unit tests do not prove its visual or input behavior.
