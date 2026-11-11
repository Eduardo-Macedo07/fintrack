/** Banco exclusivo de testes: nunca o de desenvolvimento. */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://fintrack:fintrack@localhost:5432/fintrack_test";
