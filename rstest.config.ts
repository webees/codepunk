import { withRsbuildConfig } from "@rstest/adapter-rsbuild";
import { defineConfig } from "@rstest/core";

export default defineConfig({
  extends: withRsbuildConfig(),
  setupFiles: ["./src/test/setup.ts"],
  testEnvironment: "jsdom",
  coverage: {
    enabled: false,
    provider: "v8",
    reporters: ["text", "lcov"],
    include: ["src/**/*.{ts,vue}"],
    exclude: ["src/main.ts", "src/test/**", "src/**/*.test.ts", "src/env.d.ts"],
  },
});
