# CodePunk

A headless desktop shell for the [Pi](https://pi.dev) coding agent, built with Tauri 2, Rsbuild
and Rust.

## Requirements

Bun 1.4.4+, Rust 1.90+, and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

Pi runs as a desktop sidecar over its
[RPC mode](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/rpc.md). The
Pi executable must sit beside the CodePunk executable as `pi` (or `pi.exe` on Windows); CodePunk
performs no `PATH` scan or version probe. Credentials stay in Pi's own configuration.

```bash
bun install
bun run tauri dev   # desktop
bun run dev         # browser preview
bun run check       # Biome, types and tests
bun run build       # type-check and build the frontend
bun run tauri build # build installers
```

The repository intentionally ships without UI or CSS. `src/agent.ts` is a framework-neutral event
reducer for a future interface; `src-tauri/src/agent.rs` owns the Pi process and streams its JSON
events over `pi://event`. `src-tauri/src/main.rs` only wires Tauri and its commands.

Use Conventional Commits. CI checks quality and bundles macOS, Linux and Windows artifacts.

Report vulnerabilities through the private advisory link in [SECURITY.md](SECURITY.md).
Licensed under [MIT](LICENSE).
