export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      ["app", "ui", "tauri", "ci", "docs", "deps", "repo", "release", "test"],
    ],
    "header-max-length": [2, "always", 100],
  },
};
