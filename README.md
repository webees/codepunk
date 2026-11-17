# CodePunk

A headless desktop shell for the [Pi](https://pi.dev) coding agent, built with Tauri 2, Vue 3,
Rsbuild and Rust. Pi is bundled as a Tauri sidecar; no separate installation or `PATH` lookup is
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
bun run smoke       # verify the bundled Pi sidecar answers RPC
bun run update:pi   # refresh the pinned Pi release and checksums
```

Pi versions and SHA-256 checksums live in `scripts/pi.pin.json`. `bun run update:pi` reads the
official release `SHA256SUMS` and rewrites the pin; `bun run update:pi 1.5.3` pins a specific
release. A weekly `Pi update` workflow does the same and opens a pull request for review, so no
hash is edited by hand.

The repository intentionally ships without UI or CSS. `src/App.ts` mounts an empty Vue root for the
future interface. `src/agent.ts` is the only UI-facing agent facade; `src/agent/core.ts` holds the
framework-neutral Pi protocol and state machine, while `src/agent/tauri.ts` is the thin transport.
On the Rust side, `src-tauri/src/pi.rs` owns the sidecar process and `src-tauri/src/agent.rs` only
adapts it to Tauri commands and `pi://event`; `src-tauri/src/main.rs` wires the shell.

macOS 13 or newer is required by the bundled Pi binary.

Use Conventional Commits. CI checks quality and bundles macOS, Linux and Windows artifacts.

Report vulnerabilities through the private advisory link in [SECURITY.md](SECURITY.md).
Licensed under [MIT](LICENSE).
