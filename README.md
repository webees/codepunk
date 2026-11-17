# CodePunk

A headless desktop shell for the [Pi](https://pi.dev) coding agent, built with Tauri 2, Rsbuild
and Rust. Pi is bundled as a Tauri sidecar; no separate installation or `PATH` lookup is
required.

## Requirements

Bun 1.4.4+, Rust 1.90+, and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

Builds download the pinned official Pi release from GitHub, verify its SHA-256 checksum, and place
it beside the CodePunk executable. Downloads are cached in `node_modules/.cache/pi`; the app never
downloads Pi at runtime. The bundle includes Pi's `package.json`, image-processing WASM and MIT
licence. Pi runs over its
[RPC mode](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/rpc.md), and
credentials stay in Pi's own configuration.

```bash
bun install
bun run tauri dev   # desktop, prepares the Pi sidecar automatically
bun run dev         # browser preview
bun run check       # Biome, types and tests
bun run build       # type-check and build the frontend
bun run tauri build # build installers
```

The repository intentionally ships without UI or CSS. `src/agent.ts` is a framework-neutral event
reducer for a future interface; `src-tauri/src/agent.rs` owns the Pi process and streams its JSON
events over `pi://event`. `src-tauri/src/main.rs` only wires Tauri and its commands.

macOS 13 or newer is required by the bundled Pi binary.

Use Conventional Commits. CI checks quality and bundles macOS, Linux and Windows artifacts.

Report vulnerabilities through the private advisory link in [SECURITY.md](SECURITY.md).
Licensed under [MIT](LICENSE).
