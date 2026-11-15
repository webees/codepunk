# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Migrated the frontend from React 19 / Vite 7 / Vitest to Vue 3 / Rsbuild 2 / Rstest

## [0.1.0] - 2026-11-15

### Added

- Tauri 2 desktop shell with a hardened default capability set
- React 19 + TypeScript frontend with strict compiler settings
- `runtime_info` Rust command exposing build and host metadata
- Vitest unit and component tests with coverage reporting
- ESLint, Prettier, commitlint and lint-staged quality gates
- CI matrix for macOS, Linux and Windows plus security audits
- Release workflow producing signed-ready bundles on tag pushes

[unreleased]: https://github.com/webees/codepunk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/webees/codepunk/releases/tag/v0.1.0
