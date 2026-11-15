import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import { createApp } from "vue";
import App from "./App.vue";

const core = rs.hoisted(() => ({
  invoke: rs.fn<(command: string) => Promise<unknown>>(),
  isTauri: rs.fn<() => boolean>(),
}));

rs.mock("@tauri-apps/api/core", () => core);

const runtimeInfo = {
  appVersion: "0.1.0",
  tauriVersion: "2.9.0",
  platform: "macos",
  architecture: "aarch64",
};

let host: HTMLDivElement | undefined;
let app: ReturnType<typeof createApp> | undefined;

const render = () => {
  host = document.createElement("div");
  document.body.append(host);
  app = createApp(App);
  app.mount(host);
  return host;
};

afterEach(() => {
  app?.unmount();
  host?.remove();
  app = host = undefined;
});

describe("App", () => {
  beforeEach(() => {
    core.invoke.mockReset();
    core.isTauri.mockReset().mockReturnValue(false);
  });

  it("renders the browser fallback", async () => {
    const root = render();

    expect(root.querySelector("h1")?.textContent).toBe("Codepunk");
    await expect.poll(() => root.textContent).toContain("web (unknown)");
    expect(root.textContent).toContain("browser preview");
    expect(core.invoke).not.toHaveBeenCalled();
  });

  it("announces the loading state until the bridge answers", async () => {
    core.isTauri.mockReturnValue(true);
    core.invoke.mockReturnValue(new Promise(() => undefined));

    const root = render();

    expect(root.textContent).toMatch(/inspecting the desktop bridge/i);
  });

  it("renders runtime facts from the desktop bridge", async () => {
    core.isTauri.mockReturnValue(true);
    core.invoke.mockResolvedValue(runtimeInfo);

    const root = render();

    await expect.poll(() => root.textContent).toContain("0.1.0");
    expect(root.textContent).toContain("2.9.0");
    expect(core.invoke).toHaveBeenCalledWith("runtime_info");
  });

  it.each([new Error("ipc failed"), "ipc failed"])(
    "surfaces bridge failures: %s",
    async (cause) => {
      core.isTauri.mockReturnValue(true);
      core.invoke.mockRejectedValue(cause);

      const root = render();

      await expect.poll(() => root.querySelector('[role="alert"]')?.textContent).toBe("ipc failed");
    },
  );
});
