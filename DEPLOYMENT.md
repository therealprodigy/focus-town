# Hosting Focus Town

The Cloudflare build serves the game and co-op API from one address. It uses Workers Static Assets for the frontend and D1 for profiles, rooms and rewards. The existing local preview still works.

## First deployment

Use the VS Code integrated terminal in this folder:

1. Run `npx wrangler login` and approve the login yourself in the browser.
2. Run `npx wrangler whoami` to confirm the intended account.
3. Run `npm run deploy:cloudflare`. The initial configuration disables public and preview URLs. Wrangler provisions the `focus-town-demo` database and records its ID in `wrangler.jsonc`.
4. Run `npm run db:migrate:cloudflare` to apply the SQL files in `drizzle/` to that database.
5. Set `workers_dev` to `true` in `wrangler.jsonc`, then run `npm run deploy:cloudflare` again.
6. Check the actual URL printed by Wrangler. The Worker name is `focus-town-demo`; the account's workers.dev subdomain also appears in the address. Use a neutral subdomain. Do not rename an account subdomain used by other projects without checking the impact.

Do not put an unverified or temporary address in the Pixl demo field. A successful dry run checks packaging only. Confirm the live document routes, an audio range request, profile creation and a room invitation before calling the deployment ready. The owner still needs to complete the two-browser playtest in [TEST_PLAN.md](TEST_PLAN.md).

## Later updates

Keep the recorded database ID. If a change adds migrations, apply them before deploying code that depends on them. Run `npm test` and `npm run build`; deploy with `npm run deploy:cloudflare`.

The dedicated `dist-cloudflare/` folder contains frontend assets only. Do not point Static Assets at `dist/`, which also holds the original Worker package and migration metadata. Local Wrangler state and credentials are ignored by Git.

A new host has separate browser storage. Export a save from the old address and import it at the new address to move personal progress. A save file does not transfer co-op credentials or old invitation links.

## Current verification

On 9 October 2026, all 103 automated tests, both production builds and the Cloudflare deployment dry run passed. Remote account authorization, D1 provisioning, migrations and public deployment are still pending. Nothing in this file is a claim that a playable public link exists yet.
