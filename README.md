# Codepunk

A minimal desktop foundation built with Tauri 2, Vue 3, Rsbuild and Rust. Strict TypeScript on
the frontend, a small testable Rust core, and CI that bundles installers for macOS, Linux and
Windows.

## Stack

- Tauri 2 desktop runtime and Rust backend
- Vue 3 with TypeScript, developed and bundled by Rsbuild
- Rstest with Testing Library
- Biome, rustfmt, Clippy and cargo-deny

## Getting started

Requires Bun 1.3.14+, Node.js 22.13+ or 24+ for the coverage tooling, Rust 1.90+ and the
platform-specific Tauri dependencies.

```bash
bun install
bun run tauri dev
```

Run `bun run dev` to preview the page in a browser; the runtime panel falls back to static values.

## Layout

```text
src/                 Vue entry, page and runtime bridge
src-tauri/           Rust core, Tauri configuration and icons
.github/workflows/   CI, dependency audits and cross-platform releases
```

## Scripts

| Command                 | Purpose                           |
| ----------------------- | --------------------------------- |
| `bun run check`         | Format, lint, typecheck and test  |
| `bun run build`         | Typecheck and bundle the frontend |
| `bun run tauri build`   | Build desktop installers          |
| `bun run test:coverage` | Run tests with coverage           |

## IPC

The frontend calls `runtime_info` from `src/app/runtime.ts`, which returns the app version, Tauri
version and target platform. Outside Tauri the same module returns fixed preview data and never
touches IPC.

To add a command, register a `#[tauri::command]` in `src-tauri/src/lib.rs`, then add the
TypeScript type and a test. Permissions are declared with the narrowest scope in
`src-tauri/tauri.conf.json`.

## Contributing

Commits follow Conventional Commits and the pre-commit hook runs `bun run check`. Changes must pass
`bun run check` and `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`;
behaviour changes need tests. Report vulnerabilities privately via [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
