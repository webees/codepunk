//! Build-time and host metadata exposed to the frontend.

use serde::Serialize;

/// Runtime details rendered by the frontend.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    /// Human readable application name.
    pub app_name: String,
    /// Semantic version from `Cargo.toml`.
    pub app_version: String,
    /// Version of the linked Tauri runtime.
    pub tauri_version: String,
    /// Target platform, for example `macos`.
    pub platform: String,
    /// Target CPU architecture, for example `aarch64`.
    pub architecture: String,
}

impl RuntimeInfo {
    fn current() -> Self {
        Self {
            app_name: "Codepunk".to_owned(),
            app_version: env!("CARGO_PKG_VERSION").to_owned(),
            tauri_version: tauri::VERSION.to_owned(),
            platform: std::env::consts::OS.to_owned(),
            architecture: std::env::consts::ARCH.to_owned(),
        }
    }
}

/// Returns metadata about the running desktop process.
#[tauri::command]
#[must_use]
pub fn runtime_info() -> RuntimeInfo {
    RuntimeInfo::current()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reports_compile_time_constants() {
        let info = RuntimeInfo::current();

        assert_eq!(info.app_name, "Codepunk");
        assert_eq!(info.app_version, env!("CARGO_PKG_VERSION"));
        assert_eq!(info.platform, std::env::consts::OS);
        assert_eq!(info.architecture, std::env::consts::ARCH);
    }
}
