import { withRsbuildConfig } from "@rstest/adapter-rsbuild";
import { defineConfig } from "@rstest/core";

export default defineConfig({
  extends: withRsbuildConfig(),
  testEnvironment: "jsdom",
  coverage: {
    provider: "v8",
    reporters: ["text", "lcov"],
    include: ["src/**/*.{ts,vue}"],
    exclude: ["src/main.ts", "src/**/*.test.ts"],
  },
});
