import { defineConfig } from "vitest/config";

// Sprint 2.16b — primeira config de teste deste package (antes só
// build/typecheck/lint). Node puro (sem jsdom) — os clients HTTP e o fake
// provider server (node:http) não precisam de DOM.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    exclude: ["**/node_modules/**", "dist/**"],
  },
});
