import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [react(), VitePWA({ devOptions: { enabled: false } })],
  define: { __APP_VERSION__: JSON.stringify("0.7.0-demo-test") },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/tmp/**",
      "**/dist/**",
      "**/firmware/**",
    ],
    pool: "threads",
    maxWorkers: 1,
  },
});
