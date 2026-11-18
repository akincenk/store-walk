# Roadmap

About 29 hours of planned work. Each item is a GitHub issue.

1. **Import a checklist from a JSON file** (3 h). File picker on the home screen, validated with `validateTemplate`, stored in IndexedDB next to the built-in ones, with clear errors for bad files and duplicate ids.
2. **Checklist editor** (4 h). Create and edit checklists in the app: add, rename, reorder and remove sections and items, mark items required. Walks already started keep their own copy.
3. **Precache the app shell at build time** (3 h). Generate the list of built files so the very first visit is enough for offline use, and show "A new version is ready, reload" when the service worker updates.
4. **Backup and restore** (2.5 h). Export all walks and custom checklists to one JSON file and import it on another device, skipping walks that already exist by id.
5. **Filter finished walks** (2.5 h). Filter by store, checklist and date range, and export only the filtered walks to CSV.
6. **Translations** (3 h). Move UI strings to message files, add French (Canada), pick the language from the browser with a manual switch. Checklists can carry text per language.
7. **Accessibility checks** (2 h). Run axe-core in the UI tests, do a keyboard-only and VoiceOver pass, and fix what they find.
8. **End-to-end test in CI** (2.5 h). Playwright test against `vite preview`: start a walk, go offline, reload, finish, download the CSV.
9. **Number items with a range** (3 h). Item type for readings such as fridge temperature with an allowed range; out-of-range values need a note like a No answer. CSV gets a value column.
10. **Lint and format in CI** (1.5 h). ESLint with typescript-eslint and jsx-a11y, Prettier check, both run in CI.
11. **Clean up old walks** (1 h). Setting to delete finished walks older than N days, only after they were included in an export.
12. **Ask for persistent storage** (1 h). Call `navigator.storage.persist()`, and warn on the home screen when storage is not persistent or nearly full, since the browser may otherwise clear walks.
