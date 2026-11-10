# Development

Tools are managed with [mise](https://mise.jdx.dev). Run `mise install`, then `pnpm install`.

| Command        | What it does                                               |
| -------------- | ---------------------------------------------------------- |
| `pnpm dev`     | Run the app with hot reload                                |
| `pnpm check`   | Lint (oxlint), check formatting (oxfmt), and type check    |
| `pnpm format`  | Format everything with oxfmt                               |
| `pnpm build:*` | Package for `win`, `mac`, or `linux` with electron-builder |

## Layout

- `src/main/` is the Electron main process: app lifecycle, windows, and IPC.
  - `grading/` defines a check, the response helpers checks share, and the grader that runs an assignment's checks and streams the results.
  - `assignments/` has one file per assignment, each a list of checks written against its PDF in `project-pdfs/`.
- `src/preload/` exposes `window.api` to the renderer.
- `src/renderer/` is the Svelte UI.
- `src/shared/` holds the assignment names, the grading event types, and the IPC channel names. It has no Effect code, so the renderer can import it.

A results window's address holds its submission, so the main process keeps no state per window. Each grading run gets its own `MessageChannel`. Closing it, whether by cancelling, reloading, or closing the window, stops the run.

## Adding an assignment

1. Add its name to `src/shared/assignments.ts`.
2. Write its checks in `src/main/assignments/`, following its PDF.
3. Add them to `checksByAssignment` in `src/main/assignments/index.ts`.

A check is an Effect that succeeds with a short summary, fails with `CheckFailed` when the site responds wrongly, or fails with the HTTP client's own error when the site can't be reached. Its `HttpClient` is already pointed at the submission, so checks request paths like `/hello`.

`src/main/grading/response.ts` holds small checks on a response that any assignment can use. Shortcuts that assume one assignment's routes, like "GET this page and expect 200", stay in that assignment's file until another assignment needs the same thing.

The [Effect language service](https://github.com/Effect-TS/language-service) is a TypeScript plugin set in `tsconfig.node.json`, so editors using the workspace TypeScript show its diagnostics. `pnpm typecheck` also runs them.

TypeScript stays on 6.x until `svelte-check` supports TypeScript 7.
