import { execSync } from "node:child_process";

import { TEST_DATABASE_URL } from "./test-env.mjs";

/** Aplica as migrações no banco de testes antes de toda a suíte. */
export default function setup() {
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
