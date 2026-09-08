import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@domain": fileURLToPath(new URL("./src/domain", import.meta.url)),
      "@interview": fileURLToPath(new URL("./src/interview", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src/ui", import.meta.url)),
    },
  },
  test: {
    // The domain layer is pure TypeScript, so it needs no browser.
    environment: "node",
    // All tests live in /tests, never beside the source they exercise.
    include: ["tests/**/*.test.ts"],
  },
});
