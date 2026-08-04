import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
      // See src/test/server-only-mock.ts for why this alias exists —
      // it does not weaken the guard Next.js's real build enforces.
      "server-only": path.resolve(dirname, "./src/test/server-only-mock.ts"),
    },
  },
});
