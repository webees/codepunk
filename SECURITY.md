# Security Policy

## Supported versions

Codepunk is pre-1.0. Security fixes land on `main` and in the latest published
release only.

## Reporting a vulnerability

Please report privately through GitHub's
[security advisory form](https://github.com/webees/codepunk/security/advisories/new).
Do not open a public issue.

Include:

- Affected version or commit
- Platform and OS version
- Reproduction steps or a proof of concept
- Impact assessment

## Response targets

| Stage               | Target          |
| ------------------- | --------------- |
| Acknowledgement     | 3 business days |
| Triage and severity | 7 business days |
| Fix or mitigation   | 30 days         |

We will credit reporters in the advisory unless anonymity is requested.

## Hardening baseline

- Strict Content Security Policy with no remote script origins
- Minimal Tauri capability set (`core:default`, `opener:allow-open-url`)
- `unsafe` forbidden in the Rust crate
- `cargo audit` and `cargo deny` run in CI
- Dependencies updated weekly through Dependabot

## Known advisory exceptions

`deny.toml` ignores four RustSec advisories that are unmaintained-only, not
memory-safety or exploit reports. Each reaches the dependency graph through
Tauri's Linux platform stack, so Codepunk cannot remove it without vendoring or
disabling Linux packaging:

| Advisory          | Crate              | Reason                                                     |
| ----------------- | ------------------ | ---------------------------------------------------------- |
| RUSTSEC-2024-0370 | `proc-macro-error` | Transitive GTK build dependency; upstream is unmaintained  |
| RUSTSEC-2026-0370 | `zvariant`         | Transitive Linux D-Bus dependency of `tauri-plugin-opener` |
| RUSTSEC-2026-0371 | `zbus_names`       | Transitive Linux D-Bus dependency of `tauri-plugin-opener` |
| RUSTSEC-2026-0372 | `zvariant_derive`  | Transitive Linux D-Bus dependency of `tauri-plugin-opener` |

The exceptions are reviewed with every dependency update and will be removed
once the upstream chains ship replacements.
