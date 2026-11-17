# CodePunk

A minimal desktop client for the [Pi](https://pi.dev) coding agent, built with Tauri 2, Vue 3,
Rsbuild and Rust.

## Requirements

Bun 1.4.4+, Rust 1.90+, and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

CodePunk drives a local Pi installation over its
[RPC mode](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/rpc.md), so
install and authenticate Pi once:

```bash
curl -fsSL https://pi.dev/install.sh | sh
pi   # complete provider login, then exit
```

Pi must be on `PATH`, or `CODEPUNK_PI_BIN` must point at the executable. CodePunk never stores
credentials; Pi keeps them in its own configuration.

```bash
bun install
bun run tauri dev   # desktop
bun run dev         # browser preview
bun run check       # Biome, types and tests
bun run build       # type-check and build the frontend
bun run tauri build # build installers
```

`src/` contains the Vue agent interface. `src-tauri/src/agent.rs` owns the Pi process and streams
its JSON events to the UI; `src-tauri/src/main.rs` only wires Tauri and its commands.

Use Conventional Commits. CI checks quality and bundles macOS, Linux and Windows artifacts.

Report vulnerabilities through the private advisory link in [SECURITY.md](SECURITY.md).
Licensed under [MIT](LICENSE).
