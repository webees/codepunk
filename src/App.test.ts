import { cleanup, render, screen } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";

import type { RuntimeInfo } from "./app/runtime";
import App from "./App.vue";

const core = rs.hoisted(() => ({
  invoke: rs.fn<(command: string) => Promise<RuntimeInfo>>(),
  isTauri: rs.fn<() => boolean>(),
}));

rs.mock("@tauri-apps/api/core", () => core);

const runtimeInfo: RuntimeInfo = {
  appName: "Codepunk",
  appVersion: "0.1.0",
  tauriVersion: "2.9.0",
  platform: "macos",
  architecture: "aarch64",
};

afterEach(cleanup);

describe("App", () => {
  beforeEach(() => {
    core.invoke.mockReset();
    core.isTauri.mockReset().mockReturnValue(false);
  });

  it("renders the browser fallback", async () => {
    render(App);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Codepunk");
    await screen.findByText("web (unknown)");
    screen.getByText("browser preview");
    expect(core.invoke).not.toHaveBeenCalled();
  });

  it("announces the loading state until the bridge answers", async () => {
    core.isTauri.mockReturnValue(true);
    core.invoke.mockReturnValue(new Promise(() => undefined));

    render(App);

    await screen.findByText(/inspecting the desktop bridge/i);
  });

  it("renders runtime facts from the desktop bridge", async () => {
    core.isTauri.mockReturnValue(true);
    core.invoke.mockResolvedValue(runtimeInfo);

    render(App);

    await screen.findByText("Codepunk 0.1.0");
    screen.getByText("2.9.0");
    expect(core.invoke).toHaveBeenCalledWith("runtime_info");
  });

  it.each([new Error("ipc failed"), "ipc failed"])(
    "surfaces bridge failures: %s",
    async (cause) => {
      core.isTauri.mockReturnValue(true);
      core.invoke.mockRejectedValue(cause);

      render(App);

      expect((await screen.findByRole("alert")).textContent).toBe("ipc failed");
    },
  );
});
