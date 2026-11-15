import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "@rstest/core";

import StatusPill from "./status-pill.vue";

describe("StatusPill", () => {
  it("maps the tone to a modifier class", () => {
    render(StatusPill, {
      props: { tone: "success" },
      slots: { default: "Connected" },
    });

    expect(screen.getByText("Connected")).toHaveClass("pill", "pill--success");
  });
});
