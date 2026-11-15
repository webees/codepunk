import { defineConfig } from "@rsbuild/core";
import { pluginVue } from "@rsbuild/plugin-vue";

const devHost = process.env.TAURI_DEV_HOST;
const isDebug = Boolean(process.env.TAURI_ENV_DEBUG);
const htmlTemplate = `<!doctype html>
<html lang="en">
  <body>
    <div id="root"></div>
  </body>
</html>`;

export default defineConfig({
  plugins: [pluginVue()],
  source: {
    entry: {
      index: "./src/main.ts",
    },
  },
  server: {
    host: devHost ?? "localhost",
    port: 1420,
    strictPort: true,
  },
  dev: {
    client: devHost ? { host: devHost, protocol: "ws" } : undefined,
  },
  output: {
    overrideBrowserslist:
      process.env.TAURI_ENV_PLATFORM === "windows" ? ["chrome 105"] : ["safari 13"],
    minify: !isDebug,
    sourceMap: isDebug,
  },
  tools: {
    htmlPlugin: {
      templateContent: htmlTemplate,
    },
    rspack: {
      watchOptions: {
        ignored: ["**/src-tauri/**"],
      },
    },
  },
});
