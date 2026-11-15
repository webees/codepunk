import { readFileSync } from "node:fs";

import { defineConfig } from "@rsbuild/core";
import { pluginVue } from "@rsbuild/plugin-vue";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version?: string };

const devHost = process.env.TAURI_DEV_HOST;
const isDebug = Boolean(process.env.TAURI_ENV_DEBUG);

export default defineConfig({
  plugins: [pluginVue()],
  source: {
    entry: {
      index: "./src/main.ts",
    },
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version ?? "0.0.0"),
    },
  },
  html: {
    template: "./index.html",
  },
  server: {
    host: devHost ?? "localhost",
    port: 1420,
    strictPort: true,
  },
  dev: {
    client: devHost ? { host: devHost, protocol: "ws" } : undefined,
    lazyCompilation: false,
  },
  output: {
    overrideBrowserslist:
      process.env.TAURI_ENV_PLATFORM === "windows" ? ["chrome 105"] : ["safari 13"],
    minify: !isDebug,
    sourceMap: isDebug,
  },
  tools: {
    rspack: {
      watchOptions: {
        ignored: ["**/src-tauri/**"],
      },
    },
  },
});
