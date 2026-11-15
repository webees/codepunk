# CodePunk

A minimal Tauri 2, Vue 3, Rsbuild and Rust desktop application with strict TypeScript and
cross-platform CI.

## Requirements

Bun 1.4.4+, Rust 1.90+, and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

```bash
bun install
bun run tauri dev   # desktop
bun run dev         # browser preview
bun run check       # Biome, types and tests
bun run build       # type-check and build the frontend
bun run tauri build # build installers
```

`src/` contains the Vue entry point and app shell. `src-tauri/` contains the Rust entry point,
configuration and bundle icons.

Use Conventional Commits. CI checks quality and bundles macOS, Linux and Windows artifacts.

Report vulnerabilities through the private advisory link in [SECURITY.md](SECURITY.md).
Licensed under [MIT](LICENSE).
