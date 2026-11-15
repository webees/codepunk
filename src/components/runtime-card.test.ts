import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "@rstest/core";

import type { RuntimeState } from "../hooks/use-runtime-info";
import RuntimeCard from "./runtime-card.vue";

const readyState: RuntimeState = {
  status: "ready",
  error: null,
  info: {
    appName: "Codepunk",
    appVersion: "0.1.0",
    tauriVersion: "2.9.0",
    platform: "macos",
    architecture: "aarch64",
  },
};

describe("RuntimeCard", () => {
  it("announces loading state", () => {
    render(RuntimeCard, {
      props: { state: { status: "loading", info: null, error: null } },
    });
    expect(screen.getByText(/inspecting the desktop bridge/i)).toBeInTheDocument();
  });

  it("renders runtime facts when connected", () => {
    render(RuntimeCard, { props: { state: readyState } });
    expect(screen.getByText("Connected")).toHaveClass("pill", "pill--success");
    expect(screen.getByText("Codepunk v0.1.0")).toBeInTheDocument();
    expect(screen.getByText("macos · aarch64")).toBeInTheDocument();
  });

  it("surfaces bridge errors", () => {
    render(RuntimeCard, {
      props: { state: { status: "error", info: null, error: "ipc failed" } },
    });
    expect(screen.getByText("Bridge unavailable")).toHaveClass("pill", "pill--danger");
    expect(screen.getByRole("alert")).toHaveTextContent("ipc failed");
  });
});
