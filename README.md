# Codepunk

A minimal Tauri 2, Vue 3, Rsbuild and Rust desktop starter with strict TypeScript, a tested IPC
bridge, and cross-platform CI.

## Requirements

Bun 1.3.14+, Node.js 22.13+ or 24+ for coverage, Rust 1.90+, and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

```bash
bun install
bun run tauri dev   # desktop
bun run dev         # browser preview with a static fallback
bun run check       # Biome, Vue types and coverage
bun run build       # type-check and build the frontend
bun run tauri build # build installers
```

`src/` contains the Vue entry point and component; `src-tauri/` contains the Rust core, inline
Tauri capabilities, configuration and bundle icons. Tauri commands live in
`src-tauri/src/lib.rs` and are exposed through the typed bridge in `src/App.vue`.

Use Conventional Commits. CI checks quality and bundles macOS, Linux and Windows artifacts.

Report vulnerabilities through the private advisory link in [SECURITY.md](SECURITY.md).
Licensed under [MIT](LICENSE).
