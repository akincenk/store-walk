# Contributing

Issues and pull requests are welcome.

## Setup

```sh
npm install
npm test
npm run build
```

## Before opening a pull request

- `npm run typecheck`, `npm test` and `npm run build` pass.
- New behaviour has a test. UI behaviour is tested through roles and labels (Testing Library), the way a screen reader user would find it.
- Every form control has a visible label and works with the keyboard.
- Sample data in tests and `examples/` is made up. Do not commit real store names, staff names or exports from a real store.
- Workflow changes keep actions pinned to a full commit SHA and pass `actionlint` and `zizmor --offline .`.

Keep pull requests to one change. Describe what changed and how you checked it.
