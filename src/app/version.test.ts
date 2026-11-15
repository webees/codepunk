import { describe, expect, it } from "@rstest/core";

import { compareVersions } from "./version";

describe("compareVersions", () => {
  it("reports equality for identical versions", () => {
    expect(compareVersions("1.2.3", "1.2.3")).toBe(0);
  });

  it("orders versions by major, minor and patch", () => {
    expect(compareVersions("2.0.0", "1.9.9")).toBe(1);
    expect(compareVersions("1.2.3", "1.3.0")).toBe(-1);
  });

  it("treats missing segments as zero", () => {
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
    expect(compareVersions("1.2.1", "1.2")).toBe(1);
  });

  it("ignores pre-release suffixes", () => {
    expect(compareVersions("1.0.0-beta.2", "1.0.0")).toBe(0);
  });

  it("falls back to zero for malformed segments", () => {
    expect(compareVersions("1.x.0", "1.0.0")).toBe(0);
  });
});
