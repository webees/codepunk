# Contributing to Codepunk

Thanks for taking the time to contribute. This document describes the workflow
maintainers use, so pull requests land predictably.

## Development setup

See the [README](README.md#quick-start) for prerequisites, the command reference,
and the Tauri setup steps.

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
- Component copy lives in components; shared metadata belongs in `src/app/config.ts`.
- Accessibility is part of done: semantic HTML, visible focus, and `aria-live`
  for async state.

## Rust conventions

- `unsafe` is forbidden at the crate level.
- Commands return typed, serializable structs and surface errors through the
  standard `Result` type.
- Non-trivial domain logic stays outside `tauri::command` adapters so it can be
  unit tested.
- Public items carry doc comments; `missing_docs` is enabled.

## Security

Do not open public issues for vulnerabilities. Follow `SECURITY.md`.

## License

By contributing you agree that your contributions are licensed under the MIT
License.
