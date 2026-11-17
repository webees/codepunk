import assert from "node:assert/strict";
import { test } from "node:test";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import App from "./App";

test("renders the app shell", async () => {
  assert.match(await renderToString(createSSRApp(App)), /<h1>CodePunk<\/h1>/);
});
