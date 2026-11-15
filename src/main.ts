import { createApp } from "vue";

import App from "./App.vue";
import "./styles/global.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container #root is missing from index.html");
}

createApp(App).mount(container);
