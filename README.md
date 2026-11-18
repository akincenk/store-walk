# store-walk

[![CI](https://github.com/akincenk/store-walk/actions/workflows/ci.yml/badge.svg)](https://github.com/akincenk/store-walk/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/akincenk/store-walk/badge)](https://scorecard.dev/viewer/?uri=github.com/akincenk/store-walk)

Store opening and closing checklists that run in the browser on a phone and keep working without a connection. Each item is answered Yes, No or N/A with an optional note. A walk cannot be finished while a required item is open or a No answer has no note. Finished walks download as a CSV audit trail.

## Who it is for

Shift leads and managers in small shops who walk the store at opening and closing and today use a paper sheet or a shared spreadsheet. The back room often has weak signal, so the app saves every answer on the device and needs the network only to load the first time.

## What it does

- Two built-in checklists, Store opening (13 items) and Store closing (10 items), in `src/templates/`.
- Every answer is saved to IndexedDB as soon as it is made. Closing the tab or reloading keeps the walk.
- Finishing is blocked, with a list of links to the items, when a required item is unanswered or a No answer has no note.
- A finished walk is read-only. It keeps its own copy of the checklist, so later checklist changes do not alter it.
- CSV export with one row per item: walk, store, who, start and finish time, section, item, answer, note, and when it was answered. Times are local with a UTC offset (`2026-11-18T06:05:09-08:00`). Text that a spreadsheet would run as a formula is written with a leading apostrophe.
- Installable as a web app. After the first online visit, a service worker serves the app from its cache when offline.

There is no server and no account. Data stays in the browser that recorded it until it is exported. `examples/sample-opening-walk.csv` shows the export format (fictional store).

## Stack

TypeScript, React 19, Vite, IndexedDB through [idb](https://github.com/jakearchibald/idb), a hand-written service worker (`public/sw.js`). Tests use Vitest, Testing Library and fake-indexeddb.

## Run it

Needs Node 22.12 or newer.

```sh
npm install
npm run dev        # development server, http://localhost:5173
npm test           # unit and UI tests
npm run build      # type-check and build into dist/
npm run preview    # serve the build; the service worker is only active in the build
```

`npm run dev -- --host` and `npm run preview -- --host` make it reachable from a phone on the same network. Browsers only run service workers on `https://` or `localhost`, so offline mode on a phone needs the build served over HTTPS.

## Checklists

A checklist is a JSON file with sections and items. Item ids must be unique inside the checklist.

```json
{
  "id": "opening",
  "name": "Store opening",
  "sections": [
    {
      "title": "Cash and systems",
      "items": [{ "id": "open-float", "text": "Till floats counted and match the opening amount", "required": true }]
    }
  ]
}
```

Adding your own checklist currently means adding a file to `src/templates/` and listing it in `src/templates.ts`. Importing one in the app is on the roadmap.

## Plans

See [ROADMAP.md](ROADMAP.md). Each item has a GitHub issue.

## License

MIT, see [LICENSE](LICENSE).
