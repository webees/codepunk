import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "@rstest/core";

import App from "./App.vue";

describe("App", () => {
  it("renders the starter hero, stack links, and browser fallback runtime", async () => {
    render(App);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Codepunk");
    expect(screen.getByRole("link", { name: "Vue" })).toHaveAttribute("href", "https://vuejs.org");
    expect(screen.getByRole("link", { name: "Rsbuild" })).toHaveAttribute(
      "href",
      "https://rsbuild.rs",
    );
    expect(await screen.findByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Codepunk vdev")).toBeInTheDocument();
  });
});
