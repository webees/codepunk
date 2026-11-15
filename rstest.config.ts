import { withRsbuildConfig } from "@rstest/adapter-rsbuild";
import { defineConfig } from "@rstest/core";

export default defineConfig({
  extends: withRsbuildConfig(),
  coverage: {
    provider: "v8",
    reporters: ["text", "lcov"],
    include: ["src/**/*.{ts,vue}"],
    exclude: ["src/index.ts"],
    thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
  },
});
