import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { TEST_DATABASE_URL } from "./tests/test-env.mjs";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(
        new URL("./tests/server-only-stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "demo/**/*.test.{ts,tsx}"],
    // Testes de componente podem optar pelo jsdom com: // @vitest-environment jsdom
    setupFiles: ["./vitest.setup.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      AUTH_SECRET: "segredo-de-teste-com-pelo-menos-32-caracteres",
    },
    // Testes de integração compartilham um banco: um arquivo por vez.
    fileParallelism: false,
    coverage: { provider: "v8", include: ["src/lib/**", "src/features/**"] },
  },
});
