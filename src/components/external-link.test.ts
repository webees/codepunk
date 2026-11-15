import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it, rs } from "@rstest/core";

import ExternalLink from "./external-link.vue";

describe("ExternalLink", () => {
  it("renders safe external anchor attributes", () => {
    render(ExternalLink, {
      props: { href: "https://example.com" },
      slots: { default: "Example" },
    });

    const link = screen.getByRole("link", { name: "Example" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("rel", "noreferrer noopener");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("delegates opening to the browser outside Tauri", async () => {
    const openSpy = rs.spyOn(window, "open").mockImplementation(() => null);

    render(ExternalLink, {
      props: { href: "https://example.com" },
      slots: { default: "Example" },
    });

    await fireEvent.click(screen.getByRole("link", { name: "Example" }));

    expect(openSpy).toHaveBeenCalledWith("https://example.com", "_blank", "noopener,noreferrer");
    openSpy.mockRestore();
  });
});
