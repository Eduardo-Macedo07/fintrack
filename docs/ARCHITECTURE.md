# Arquitetura do FinTrack

## Visão geral

Aplicação monolítica em Next.js (App Router). Frontend e backend vivem no mesmo projeto e no mesmo deploy:

```
Navegador ──► Next.js (Vercel)
                ├─ Server Components  → leitura de dados (Prisma direto)
                ├─ Server Actions     → mutações (criar/editar/excluir)
                └─ Route Handlers     → endpoints que precisam ser HTTP (ex.: export CSV, Auth.js)
                        │
                        ▼
                  Prisma ──► PostgreSQL
```

## Organização por feature

Cada domínio tem sua pasta em `src/features/<feature>/`:

- `components/`: UI específica da feature
- `server/`: queries, Server Actions e regras de negócio
- `schemas.ts` (quando existir): schemas Zod compartilhados entre formulário e servidor

`src/app/` contém apenas rotas e composição. A lógica fica nas features.

## Regras que valem para todo o código

1. **Autorização:** toda query e mutação filtra por `userId` obtido da sessão no servidor. Nunca confiar em `userId` vindo do cliente.
2. **Validação:** toda entrada externa passa por um schema Zod no servidor, mesmo que o formulário já valide.
3. **Dinheiro:** inteiro em centavos (`src/lib/money.ts`). No banco, coluna inteira (`Int`/`BigInt`).
4. **Regras financeiras puras:** parcelamento, fechamento de fatura, recorrência e saldo são funções puras com testes unitários, sem dependência de React ou Prisma.
5. **Datas:** armazenadas em UTC; a competência de uma fatura é calculada por função pura a partir da data da compra e do dia de fechamento do cartão.

## Next.js 16: pontos que afetam o projeto

Confirmados na documentação que acompanha o pacote (`node_modules/next/dist/docs`):

- `middleware.ts` foi renomeado para **`proxy.ts`**. Será usado apenas para checagens otimistas de sessão (redirecionar quem não está logado). A autorização real fica nas queries e Server Actions.
- O scaffold habilita **`cacheComponents`** e **`partialPrefetching`**. Com isso, dados são dinâmicos por padrão e o acesso a dados de runtime (cookies, sessão, banco) precisa estar sob `<Suspense>`. Isso combina com um app autenticado, mas precisa ser validado junto com o Auth.js na Etapa 2.

## Decisões em aberto

- Valor monetário no banco: `Int` em centavos (simples, suficiente para uso pessoal) vs. `Decimal`. Tendência: `Int`.
- Estratégia de sessão do Auth.js: JWT vs. sessão em banco. A decidir na Etapa 2.
- Compatibilidade do Auth.js v5 (beta) com Next 16 e `cacheComponents`: verificar antes de adotar.
