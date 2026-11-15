# Contributing to Codepunk

Thanks for taking the time to contribute. This document describes the workflow
maintainers use, so pull requests land predictably.

## Prerequisites

- Node.js 22.12 or newer (see `.nvmrc`)
- pnpm 11 (enabled through Corepack: `corepack enable`)
- Rust 1.90 or newer with `rustfmt` and `clippy`
- Platform build dependencies from the
  [Tauri prerequisites guide](https://tauri.app/start/prerequisites/)

## Getting started

```bash
pnpm install
pnpm tauri dev
```

The webview alone runs with `pnpm dev`. It falls back to browser-safe runtime
values when the Tauri IPC bridge is unavailable.

## Scripts

| Command            | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `pnpm dev`         | Rsbuild dev server on port 1420                |
| `pnpm build`       | Type-check and build the frontend bundle       |
| `pnpm tauri dev`   | Full desktop app with hot reload               |
| `pnpm tauri build` | Production installers for the current platform |
| `pnpm lint`        | ESLint with zero-warning policy                |
| `pnpm typecheck`   | TypeScript project references check            |
| `pnpm test`        | Rstest unit and component tests                |
| `pnpm format`      | Prettier write                                 |
| `pnpm check`       | Format, lint, typecheck and tests in one pass  |

Rust checks:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

## Branching and commits

- Branch from `main`, use `feat/`, `fix/`, `docs/` or `chore/` prefixes.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
  Allowed scopes: `app`, `ui`, `tauri`, `ci`, `docs`, `deps`, `repo`, `release`,
  `test`.
- Keep pull requests focused. One concern per PR, with a short description of the
  problem, the approach, and the verification performed.

Example:

```text
feat(tauri): expose runtime metadata command
```

## Quality gates

Every pull request must pass:

- `pnpm check` (format, lint, typecheck, tests)
- `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test`
- The CI matrix on macOS, Linux and Windows

Pre-commit hooks run `lint-staged`; commit messages are validated by commitlint.
Hooks are installed automatically by `pnpm install`.

## Frontend conventions

- Strict TypeScript: no `any`, no non-null assertions outside tests, no ignored
  promises.
- Prefer small components in `src/components` and pure helpers in `src/app`.
- Every user-facing string lives in a component, not in a helper.
- Accessibility is part of done: semantic HTML, visible focus, and `aria-live`
  for async state.

## Rust conventions

- `unsafe` is forbidden at the crate level.
- Commands return typed, serializable structs and surface errors through the
  standard `Result` type.
- Domain logic stays outside `tauri::command` functions so it can be unit tested.
- Public items carry doc comments; `missing_docs` is enabled.

## Security

Do not open public issues for vulnerabilities. Follow `SECURITY.md`.

## License

By contributing you agree that your contributions are licensed under the MIT
License.
