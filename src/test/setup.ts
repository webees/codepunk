import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/vue";
import { afterEach, expect } from "@rstest/core";

expect.extend(matchers);
afterEach(() => {
  cleanup();
});
