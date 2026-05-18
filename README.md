# grader-app

An Electron application with Svelte and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

## Devcontainer

This repo includes a cross-platform devcontainer for development on Linux, macOS, and Windows hosts. Electron runs inside a lightweight Linux desktop in the container, and that desktop is exposed through noVNC in the browser. The browser is only viewing the container desktop, so Electron main/preload/renderer behavior and IPC stay unchanged.

### Prerequisites

- A devcontainer-capable editor such as VS Code with the Dev Containers extension
- Docker Desktop on macOS or Windows, or a local Docker/Podman setup on Linux

### Open And Run

1. Open the repository in the devcontainer.
2. Wait for dependency installation to finish in `postCreateCommand`.
3. Open the forwarded `6080` port labeled `Electron Desktop`.
4. Start the app inside the container:

```bash
$ pnpm dev:container
```

You can also run `.devcontainer/scripts/run-electron.sh` directly. It will start the desktop services if they are not already running.

### Useful Ports

- `6080`: noVNC desktop for the Electron window
- `5173`: Vite renderer dev server for debugging

### Repo Tooling In The Container

```bash
$ pnpm typecheck
$ pnpm lint
$ pnpm test
```

### Limitations

- This setup is for development only.
- The UI is served through a browser-accessible Linux desktop, not a native host window.
- macOS and Windows packaging are not supported from this Linux container.
- GPU acceleration is not guaranteed across host platforms; the container defaults to software rendering for portability.

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```
