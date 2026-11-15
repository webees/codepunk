import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RuntimeCard } from "./runtime-card";
import type { RuntimeState } from "../hooks/use-runtime-info";

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
    render(<RuntimeCard state={{ status: "loading", info: null, error: null }} />);
    expect(screen.getByText(/inspecting the desktop bridge/i)).toBeInTheDocument();
  });

  it("renders runtime facts when connected", () => {
    render(<RuntimeCard state={readyState} />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Codepunk v0.1.0")).toBeInTheDocument();
    expect(screen.getByText("macos · aarch64")).toBeInTheDocument();
  });

  it("surfaces bridge errors", () => {
    render(<RuntimeCard state={{ status: "error", info: null, error: "ipc failed" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("ipc failed");
  });
});
