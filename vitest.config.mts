import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Testes de componente podem optar pelo jsdom com: // @vitest-environment jsdom
    setupFiles: ["./vitest.setup.ts"],
    coverage: { provider: "v8", include: ["src/lib/**", "src/features/**"] },
  },
});
