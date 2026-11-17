import { createApp, h } from "vue";

const App = { render: () => h("main", h("h1", "CodePunk")) };

if (typeof document !== "undefined") createApp(App).mount("#root");

export default App;
