import { defineConfig } from "@rsbuild/core";

const isDebug = process.env.TAURI_ENV_DEBUG === "true";
const htmlTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>CodePunk</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

export default defineConfig({
  source: {
    entry: { index: "./src/App.ts" },
  },
  server: {
    port: 1420,
    strictPort: true,
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
