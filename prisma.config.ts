import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// O Next.js lê .env.local; o CLI do Prisma, por padrão, só lê .env.
// Carregamos os dois (o primeiro a definir uma variável vence).
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
