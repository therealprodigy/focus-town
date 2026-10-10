# Hosting Focus Town

[Play Focus Town](https://focus-town-greenvale.vercel.app)

The public frontend and room API run on Vercel. Turso stores device profiles, invitations, room state, comparisons and completion receipts. Personal progress still lives in each player’s browser.

The project was created on Vercel Hobby and Turso Starter at $0/month. Free plans have usage limits. No paid upgrade or overage plan was selected. Check the providers’ dashboards before changing a plan.

## Publish an update

Use the VS Code integrated terminal in this repository. Install Node.js 24 or newer and run `npm ci` when dependencies change.

1. Run `npm test` and `npm run build`.
2. Run `npx vercel login` if this computer is not signed in. Complete authorization in your browser.
3. If the checkout is not linked, run `npx vercel link` and choose the existing Focus Town project. Do not create another database or project for an ordinary update.
4. Run `npx vercel deploy --prod --scope ace-d3af`. The remote build applies migrations, builds the frontend and publishes the API.
5. Check the production alias printed by Vercel. Verify a normal page, an unknown route, an audio range request and a shared-room invitation.

GitHub is the source repository, but automatic deployments from pushes are not connected yet. A successful Git push alone does not publish a new game build.

## Database and secrets

The Turso integration provides `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to production. Keep these server-only. Never prefix them with `VITE_`, paste them into a journal, or commit downloaded environment files.

The build command in `vercel.json` runs `npm run db:migrate:turso` before `npm run build:hosted`. Each migration and its ledger entry are committed together. Already-applied migrations are skipped; changed migration contents cause a failure. Add a new SQL migration instead of editing one already applied. Review destructive changes before publishing them.

The separate `dist-web/` directory contains only browser assets. Function imports use explicit JavaScript extensions so they resolve after TypeScript is emitted. API routing precedes the static fallback. Unknown document routes return HTTP 404 and load the game’s Off the Map page.

## Optional Cloudflare adapter

The repository also includes `server/cloudflare.ts` and `wrangler.jsonc` for Workers with D1. They are not the active public deployment. Moving there requires a separate account setup, database and migration run. Do not publish local database files or credentials.

## Saves and testing

A new hostname has separate browser storage. Export a save from the old address and import it at the new one to move personal progress. A save file does not transfer co-op credentials or old invitation links.

The 10 October update passed 154 automated tests, both production builds and the built Worker route/audio checks. These cover the expanded village, coffee accounting, shared appearance, save compatibility and bridge prerequisites as well as the established room and timer rules. See TEST_PLAN.md for the still-required browser and two-device checks. Publication and live API verification are recorded separately from local tests.

The existing project was verified on 10 October under the ACE team (scope ace-d3af): focus-town-greenvale, project ID prj_82TJLcnZsFHKs52lJSAH8P2Yqu4E. Its ID matches the local link. The earlier account-access diagnosis was incorrect; a new project or database is not needed.

Clockworks was published on 10 October 2026 at https://focus-town-greenvale.vercel.app. Public page and legal routes return 200, an unknown route returns 404, and rain audio serves byte ranges with 206. Browser playtesting remains pending.

The personal-desk update (source commit 6e812a8) was published on 10 October 2026 to the same public URL. The deployed bundle includes the background chooser, compact timer and practice intro. HTTP checks returned 200 for the home and cookies pages and 404 for an unknown route. Tests: 161 passed; both builds passed. Visual browser checks remain pending.

The save-handoff and tutorial fixes (source commit 3c114b6) were published on 10 October 2026. The public bundle `/assets/index-CFYVVGTF.js` matches the locally tested build byte for byte. Home and cookies routes return 200; the unknown-route check returns 404. All 173 tests and both builds passed. This verifies publication, not rendered or two-tab browser behavior.

The roof-attachment and fountain fixes (source commit a2bdc2b) were published on 10 October 2026. The home page references `/assets/index-l1w73j8a.js`, which matches the locally tested build byte for byte. Home and cookies return 200; an unknown route returns 404. All 182 tests and both builds passed. Browser appearance remains unverified.
