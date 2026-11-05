# Development

Tools are managed with [mise](https://mise.jdx.dev). Run `mise install`, then `pnpm install`.

| Command        | What it does                                               |
| -------------- | ---------------------------------------------------------- |
| `pnpm dev`     | Run the app with hot reload                                |
| `pnpm check`   | Lint (oxlint), check formatting (oxfmt), and type check    |
| `pnpm format`  | Format everything with oxfmt                               |
| `pnpm build:*` | Package for `win`, `mac`, or `linux` with electron-builder |

## Layout

- `src/main/` is the Electron main process: app lifecycle and windows.
- `src/preload/` exposes `window.api` to the renderer.
- `src/renderer/` is the Svelte UI.

The [Effect language service](https://github.com/Effect-TS/language-service) is a TypeScript plugin set in `tsconfig.node.json`, so editors using the workspace TypeScript show its diagnostics. `pnpm typecheck` also runs them.

TypeScript stays on 6.x until `svelte-check` supports TypeScript 7.
