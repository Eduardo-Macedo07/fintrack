import { execSync } from "node:child_process";

import { TEST_DATABASE_URL } from "./test-env.mjs";

/** Aplica as migrações no banco de testes antes de toda a suíte. */
export default function setup() {
  try {
    execSync("npx prisma migrate deploy", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    });
  } catch (error) {
    const output = String((error as { stderr?: Buffer | string }).stderr ?? error);
    const unreachable = output.includes("P1001");
    throw new Error(
      unreachable
        ? "Não foi possível conectar ao PostgreSQL de testes.\n" +
            "Suba o banco com `docker compose up -d` e rode os testes de novo.\n" +
            `URL usada: ${TEST_DATABASE_URL.replace(/:[^:@/]*@/, ":***@")}`
        : `Falha ao aplicar as migrações no banco de testes:\n${output}`,
    );
  }
}
