/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any -- Rstest's Matchers generic must match exactly for declaration merging. */
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "@rstest/core" {
  interface Matchers<T = any> extends TestingLibraryMatchers<T, void> {}
}
