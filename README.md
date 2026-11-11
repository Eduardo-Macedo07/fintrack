# FinTrack

Plataforma web de **controle financeiro pessoal**: receitas, despesas, cartões de crédito, parcelas e metas de economia. Projeto full-stack em TypeScript, construído do zero com foco em regras de negócio reais (parcelamento, fechamento de fatura, saldo correto) e em qualidade de engenharia (testes, CI, validação de entrada, autorização por usuário).

> **Status:** em desenvolvimento. Etapas 1 (arquitetura) e 2 (banco de dados e autenticação) concluídas.

## Stack

| Camada         | Tecnologia                                         |
| -------------- | -------------------------------------------------- |
| Frontend       | React 19 + TypeScript                              |
| Framework      | Next.js 16 (App Router)                            |
| Estilização    | Tailwind CSS v4                                    |
| Componentes    | shadcn/ui (Radix + CVA)                            |
| Backend        | Server Components, Server Actions e Route Handlers |
| Banco de dados | PostgreSQL 17                                      |
| ORM            | Prisma                                             |
| Autenticação   | Auth.js                                            |
| Gráficos       | Recharts                                           |
| Qualidade      | Vitest, ESLint, Prettier, GitHub Actions           |
| Deploy         | Vercel + PostgreSQL hospedado                      |

## Funcionalidades

- [x] **Autenticação**: cadastro, login e isolamento dos dados por usuário
- [ ] **Dashboard**: saldo total, receitas, despesas e gráficos
- [ ] **Transações**: criar, editar, excluir e filtrar movimentações
- [ ] **Cartões de crédito**: limites, compras parceladas e faturas mensais
- [ ] **Categorias**: padrão e personalizadas
- [ ] **Metas financeiras**: objetivos de economia e progresso
- [ ] **Relatórios**: comparação entre meses, gráficos e exportação CSV

## Como rodar localmente

Pré-requisitos: Node.js 22+ e Docker.

```bash
git clone https://github.com/Eduardo-Macedo07/fintrack.git
cd fintrack
docker compose up -d          # PostgreSQL local (bancos fintrack e fintrack_test)
npm install                   # também gera o Prisma Client (postinstall)
cp .env.example .env.local    # preencha AUTH_SECRET (openssl rand -base64 32)
npm run db:migrate            # cria as tabelas
npm run dev
```

Abra <http://localhost:3000>.

## Scripts

| Comando              | O que faz                                                              |
| -------------------- | ---------------------------------------------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento                                            |
| `npm run build`      | Build de produção                                                      |
| `npm run lint`       | ESLint                                                                 |
| `npm run typecheck`  | Checagem de tipos (`tsc --noEmit`)                                     |
| `npm run format`     | Formata o código com Prettier                                          |
| `npm test`           | Testes unitários e de integração (Vitest; precisa do PostgreSQL no ar) |
| `npm run db:migrate` | Cria/aplica migrações no banco de desenvolvimento                      |
| `npm run db:studio`  | Interface visual do banco (Prisma Studio)                              |

O CI (`.github/workflows/ci.yml`) sobe um PostgreSQL e roda formatação, lint, tipos, testes e build a cada push e pull request.

## Arquitetura

Resumo; detalhes e decisões em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

```
src/
├── app/          # Rotas, layouts e páginas (somente composição)
├── components/   # UI compartilhada (ui/ = shadcn, layout/ = shell do app)
├── features/     # Um módulo por domínio: auth, transactions, cards, goals...
│   └── <feature>/{components,server}
├── lib/          # Utilitários puros e testáveis (dinheiro, env, utils)
├── server/       # Infra de servidor compartilhada (cliente do banco, sessão)
└── hooks/        # Hooks de React reutilizáveis
prisma/           # Schema e migrações
docs/             # Documentação do projeto
```

## Decisões de design

- **Dinheiro é inteiro em centavos.** Nunca `float`. Ver [`src/lib/money.ts`](src/lib/money.ts).
- **Parcelas não perdem centavos.** `splitInstallments(1000, 3)` → `[334, 333, 333]`.
- **Variáveis de ambiente validadas com Zod** na inicialização ([`src/lib/env-schema.ts`](src/lib/env-schema.ts)).
- **Regras de negócio em funções puras**, separadas de React e do banco, para serem testáveis.
- **Toda consulta é escopada pelo `userId` da sessão.** Nunca por um id vindo do cliente.

## Roadmap

1. ✅ Preparação e arquitetura
2. ✅ Banco de dados e autenticação
3. ⬜ Dashboard e CRUD de transações
4. ⬜ Regras financeiras (parcelas, faturas, recorrência)
5. ⬜ Relatórios e qualidade
6. ⬜ Deploy e portfólio

## Licença

MIT
