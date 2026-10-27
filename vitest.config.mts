import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // Next's server-only guard throws outside the Next bundler.
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Tests share one Postgres database.
    fileParallelism: false,
    testTimeout: 20_000,
    setupFiles: ["tests/setup.ts"],
  },
});
