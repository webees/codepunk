<div align="center">

<img src="assets/logo.svg" width="96" height="96" alt="Codepunk logo" />

# Codepunk

**A small, honest desktop foundation — Tauri 2, Vue 3, Rsbuild, Rust.**

[![CI](https://github.com/webees/codepunk/actions/workflows/ci.yml/badge.svg)](https://github.com/webees/codepunk/actions/workflows/ci.yml)
[![Release](https://github.com/webees/codepunk/actions/workflows/release.yml/badge.svg)](https://github.com/webees/codepunk/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-c8f751.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.x-24c8db.svg)](https://tauri.app)
[![Rust 1.90+](https://img.shields.io/badge/Rust-1.90%2B-b7410e.svg)](https://www.rust-lang.org)

</div>

## Why

Most desktop starters are demos: permissive types, no CI, no security policy, no
opinion about how a command should be shaped. Codepunk is the opposite — a
deliberately small app that already satisfies the conventions a real project
needs on day one.

- **Type-safe across the boundary.** One Rust struct, one TypeScript interface,
  strict compilers on both sides.
- **Secure by default.** Locked-down CSP, minimal capabilities, no remote script
  origins, `unsafe` forbidden.
- **Verified, not claimed.** Format, lint, typecheck, unit tests and Rust tests
  run locally and in a three-OS CI matrix.
- **Boring where it counts.** No state library, no design system dependency, no
  generated abstraction layer to maintain.

## Stack

| Layer   | Choice                                   |
| ------- | ---------------------------------------- |
| Shell   | Tauri 2                                  |
| UI      | Vue 3.5 + TypeScript 5.9 (strict)        |
| Build   | Rsbuild 2                                |
| Core    | Rust 2021, `serde`                       |
| Tests   | Rstest + Testing Library, `cargo test`   |
| Quality | ESLint 9, Prettier 3, clippy, commitlint |
| CI/CD   | GitHub Actions (macOS, Ubuntu, Windows)  |

## Quick start

```bash
corepack enable
pnpm install
pnpm tauri dev
```

Webview only, useful for fast UI iteration:

```bash
pnpm dev
```

Production bundle for the current platform:

```bash
pnpm tauri build
```

Artifacts land in `src-tauri/target/release/bundle/`.

## Project layout

```text
.
├── src/                      # Vue frontend
│   ├── app/                  # Config and IPC adapter
│   ├── components/           # Presentational components
│   ├── hooks/                # Vue composables
│   ├── styles/               # Layered CSS with design tokens
│   └── test/                 # Rstest setup
├── src-tauri/                # Rust core
│   ├── capabilities/         # Window permission sets
│   └── src/                  # Commands and domain logic
├── .github/workflows/        # CI and release pipelines
└── assets/                   # README artwork
```

## The IPC contract

Rust defines the payload once:

```rust
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo { /* ... */ }

#[tauri::command]
pub fn runtime_info() -> RuntimeInfo { /* ... */ }
```

The frontend mirrors it in `src/app/runtime.ts` and calls it through a thin
adapter that degrades gracefully when the webview runs in a browser. Add a new
command to `invoke_handler` in `src-tauri/src/lib.rs`, expose it through a
capability, then wrap the call in `src/app`.

## Scripts

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `pnpm dev`         | Rsbuild dev server (port 1420)    |
| `pnpm build`       | Type-check and build the frontend |
| `pnpm tauri dev`   | Desktop app with hot reload       |
| `pnpm tauri build` | Platform installers               |
| `pnpm lint`        | ESLint, zero warnings allowed     |
| `pnpm typecheck`   | Project-reference type check      |
| `pnpm test`        | Rstest run                        |
| `pnpm check`       | Format + lint + typecheck + tests |
| `pnpm format`      | Prettier write                    |

Rust:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

## Releases

Tagging `v*` triggers `.github/workflows/release.yml`, which builds bundles for
macOS (universal), Linux (x64) and Windows (x64), then attaches them to a draft
GitHub release. Bundles are unsigned unless the relevant secrets are configured;
the workflow records the signing state in the run summary.

Optional secrets for signed release builds:

| Secret                               | Purpose                         |
| ------------------------------------ | ------------------------------- |
| `TAURI_SIGNING_PRIVATE_KEY`          | Updater bundle signing          |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Key password                    |
| `APPLE_CERTIFICATE`                  | macOS signing certificate (p12) |
| `APPLE_CERTIFICATE_PASSWORD`         | Certificate password            |
| `APPLE_SIGNING_IDENTITY`             | macOS signing identity          |
| `APPLE_ID` / `APPLE_PASSWORD`        | Notarization credentials        |

## Security

Default hardening: strict CSP, no remote code, capability-scoped IPC,
`unsafe` forbidden, weekly dependency updates, and `cargo audit` / `cargo deny`
in CI. Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). Commits follow Conventional Commits and
are enforced by hooks; pull requests must pass `pnpm check` plus Rust checks.

## License

[MIT](LICENSE)
