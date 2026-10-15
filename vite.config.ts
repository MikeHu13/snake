import { defineConfig } from "vitest/config";

export default defineConfig({
  // relative Pfade, damit dist/ in jedem Unterordner eines Webservers läuft
  base: "./",
  server: { port: 5173, strictPort: true },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
