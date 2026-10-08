# Working on FocusRaid

- Continue the existing React, TypeScript, Vite, and Canvas project. Do not replace it with a separate hosted builder project.
- For the current owner-requested workflow, enter code and documentation edits through VS Code and run development commands in its integrated terminal.
- Inspect existing changes before editing. Preserve unrelated work and never force-push over another commit.
- Keep timer transitions and reward rules in `src/game/state.ts`. Save completion and rewards together; never award a session twice.
- Keep Canvas rendering separate from game rules. Use accessible HTML for menus and dialogs.
- Run `npm run test` and `npm run build` for changes to behavior. Use the browser checks in `TEST_PLAN.md` when interaction or visual behavior changes.
- Respect browser permission denials. Do not use another browser or hidden automation to bypass one.
- Treat planned features as planned. Do not label a local build as deployed or a written test as passed.
- Keep journals and documentation tied to observed work. Disclose AI assistance. Do not fabricate human hours, playtest observations, submissions, or commit history.
- Use original or properly licensed assets. Record any new external assets and their licenses.
- Add the shop, forest, combat, and later regions only after the first loop is tested. Avoid a backend until a feature needs it.
