#!/usr/bin/env node
/**
 * Prepara o ambiente local em um comando:  npm run setup
 *
 *   1. cria .env.local com um AUTH_SECRET novo (se ainda não existir)
 *   2. sobe o PostgreSQL com Docker (pule com --skip-docker se já tem um Postgres)
 *   3. aplica as migrações
 *   4. cria a conta de demonstração (pule com --no-seed)
 *
 * Depois:  npm run dev  →  http://localhost:3000
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const args = new Set(process.argv.slice(2));
const win = process.platform === "win32";

function step(message) {
  console.log(`\n▸ ${message}`);
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function run(cmd, cmdArgs, hint) {
  const result = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: win });
  if (result.error || result.status !== 0) fail(hint);
}

const major = Number(process.versions.node.split(".")[0]);
if (major < 22)
  fail(`Precisa do Node 22 ou mais novo (você tem ${process.versions.node}).`);

// 1. .env.local
step("Configurando .env.local");
if (existsSync(".env.local")) {
  console.log("  .env.local já existe: mantido como está.");
} else {
  const example = readFileSync(".env.example", "utf8");
  const secret = randomBytes(32).toString("base64");
  writeFileSync(
    ".env.local",
    example.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET="${secret}"`),
  );
  console.log("  .env.local criado com um AUTH_SECRET novo.");
}

// 2. Banco
if (args.has("--skip-docker")) {
  step("Pulando o Docker (--skip-docker): usando o Postgres que você já tem.");
} else {
  step("Subindo o PostgreSQL (Docker)");
  const hasDocker = spawnSync("docker", ["--version"], { shell: win }).status === 0;
  if (!hasDocker) {
    fail(
      "Docker não encontrado. Instale o Docker Desktop, ou use seu próprio PostgreSQL:\n" +
        "  ajuste DATABASE_URL no .env.local e rode  npm run setup -- --skip-docker",
    );
  }
  run(
    "docker",
    ["compose", "up", "-d", "--wait"],
    "Não foi possível subir o banco. O Docker está aberto e rodando?",
  );
}

// 3. Migrações
step("Criando as tabelas");
run(
  "npx",
  ["prisma", "migrate", "deploy"],
  "Não foi possível aplicar as migrações. O PostgreSQL está no ar e a DATABASE_URL está certa?",
);

// 4. Dados de demonstração
if (args.has("--no-seed")) {
  step("Pulando a conta de demonstração (--no-seed).");
} else {
  step("Criando a conta de demonstração");
  run("npm", ["run", "db:seed"], "Não foi possível criar a conta de demonstração.");
}

console.log("\n✔ Pronto! Rode  npm run dev  e abra http://localhost:3000");
