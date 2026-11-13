#!/usr/bin/env node
/**
 * Gera a versão de demonstração do FinTrack como UMA página estática:  npm run demo:build
 *
 * Empacota os componentes reais do app (src/) com uma camada de dados que roda no navegador
 * (demo/), no lugar do Next.js + PostgreSQL. Saída em demo/dist/:
 *   - fintrack.html  conteúdo da página (sem <html>/<head>: o serviço de hospedagem adiciona)
 *   - preview.html   o mesmo conteúdo dentro de um documento completo, para abrir localmente
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const demo = (...parts) => resolve(root, "demo", ...parts);
const out = demo("dist");
mkdirSync(out, { recursive: true });

/** Troca o que depende de servidor pelos substitutos da demonstração e barra o resto. */
const serverless = {
  name: "serverless",
  setup(b) {
    const swap = {
      "next/link": demo("shims/next-link.tsx"),
      "next/navigation": demo("shims/next-navigation.ts"),
      "@/lib/current-search": demo("shims/current-search.ts"),
    };
    b.onResolve(
      { filter: /^(next\/link|next\/navigation|@\/lib\/current-search)$/ },
      (args) => ({
        path: swap[args.path],
      }),
    );

    // As Server Actions viram funções que falam com o armazenamento do navegador.
    b.onResolve({ filter: /server\/actions$/ }, (args) => {
      if (args.importer.includes("/features/auth/"))
        return { path: demo("actions-auth.ts") };
      if (args.importer.includes("/features/transactions/")) {
        return { path: demo("actions-transactions.ts") };
      }
      return {
        errors: [{ text: `Server Action sem substituto na demonstração: ${args.path}` }],
      };
    });

    // Rede de segurança: nada de código de servidor dentro da página.
    b.onResolve(
      {
        filter:
          /^(server-only|next-auth|bcryptjs|pg|@prisma\/|next\/|@\/server\/|@\/generated\/)/,
      },
      (args) => ({
        errors: [
          {
            text: `"${args.path}" é código de servidor (importado por ${args.importer})`,
          },
        ],
      }),
    );
  },
};

const bundle = await build({
  entryPoints: [demo("main.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "none",
  write: false,
  absWorkingDir: root,
  plugins: [serverless],
  logLevel: "warning",
});
// Dentro de <script>, "</script" e "<!--" encerrariam/alterariam o bloco: escapa os dois.
const js = bundle.outputFiles[0].text
  .replace(/<\/script/gi, "\\x3C/script")
  .replace(/<!--/g, "\\x3C!--");

// CSS do app + demonstração, compilado pelo Tailwind (só as classes usadas).
const cssFile = resolve(out, "demo.css");
execFileSync(
  "npx",
  ["@tailwindcss/cli", "-i", demo("demo.css"), "-o", cssFile, "--minify"],
  { cwd: root, stdio: ["ignore", "ignore", "inherit"] },
);
let css = readFileSync(cssFile, "utf8");

// Quem não escolheu tema (nem no app, nem no visualizador) segue o sistema: repete os tokens
// escuros do globals.css dentro de prefers-color-scheme, para não haver duas fontes da verdade.
const globals = readFileSync(resolve(root, "src/app/globals.css"), "utf8");
const dark = /:root\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(globals);
if (!dark) throw new Error("Bloco de tema escuro não encontrado em globals.css");
css += `\n@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark[1]}}}`;

const fonts =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=Geist:wght@400..700&display=swap";

const page = `<title>FinTrack</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="${fonts}">
<style>${css}</style>
<div id="root"></div>
<script>${js}</script>
`;
writeFileSync(resolve(out, "fintrack.html"), page);

// Documento completo equivalente ao que a hospedagem monta, para testar localmente.
writeFileSync(
  resolve(out, "preview.html"),
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>${page}</body></html>`,
);

const kb = (text) => `${Math.round(Buffer.byteLength(text) / 1024)} KB`;
console.log(`demo/dist/fintrack.html  ${kb(page)}  (js ${kb(js)}, css ${kb(css)})`);
