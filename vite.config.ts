import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  preview: { host: true },
  test: { environment: "jsdom", setupFiles: ["tests/setup.ts"] },
});
