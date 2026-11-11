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
- O scaffold habilita **`cacheComponents`** e **`partialPrefetching`**. Com isso, dados são dinâmicos por padrão e o acesso a dados de runtime (cookies, sessão, banco) precisa estar sob `<Suspense>`. Isso combina com um app autenticado. **Validado na Etapa 2:** com o Auth.js v5, o `next build` passa e `/dashboard` sai como _Partial Prerender_ (cabeçalho estático + conteúdo com sessão em streaming). Toda leitura de sessão fica atrás de `<Suspense>`.

## Autenticação e autorização

Auth.js v5 (beta) com provider de **credenciais** (e-mail + senha) e **sessão JWT** em cookie `HttpOnly`, 7 dias.

```
Formulário ──► Server Action (valida com Zod) ──► registerUser / signIn
                                                     │
proxy.ts  ── checagem otimista (só lê o JWT) ────────┤
                                                     ▼
Página/Action privada ──► requireUser() ──► confere o usuário NO BANCO ──► queries com userId
```

- **`proxy.ts`** apenas redireciona quem não tem sessão. Não é a barreira de segurança.
- **`requireUser()`** (`src/server/session.ts`) é a barreira real: além do JWT, consulta o banco. Assim, um usuário excluído perde o acesso na hora, mesmo com o token ainda válido.
- **Cada página privada chama `requireUser()`**. Layouts não re-renderizam a cada navegação, então não bastam como proteção.
- **Senhas:** bcrypt, custo 12. Limite de 72 bytes validado (limite do algoritmo).
- **Login não revela se o e-mail existe:** mesma mensagem e mesmo tempo de resposta (hash descartável quando o usuário não existe).
- **Cadastro é atômico:** usuário, conta "Carteira" e categorias padrão são criados em uma transação. E-mail duplicado é garantido pela constraint única do banco, inclusive em requisições simultâneas (coberto por teste).
- **Config dividida** (`auth.config.ts` leve, usada no proxy; `auth.ts` completo): o proxy não precisa carregar banco nem bcrypt.

## Banco de dados

- **Prisma 7** com driver adapter (`@prisma/adapter-pg`). O client gerado vai para `src/generated/` (ignorado no Git; gerado no `postinstall`).
- Valores monetários: **`Int` em centavos**.
- Categorias padrão são **copiadas para cada usuário** no cadastro, para que cada um edite as suas sem afetar os outros.
- Exclusão: conta com transações **não pode** ser apagada (`Restrict`; usa-se `archivedAt`). Categoria apagada deixa a transação sem categoria (`SetNull`).
- Testes de integração rodam contra um banco separado (`fintrack_test`) com as migrações reais, em um arquivo por vez.

## Limitações conhecidas (a tratar nas próximas etapas)

- **Sem limite de tentativas de login** (rate limiting). Necessário antes de uso real.
- **Sem verificação de e-mail nem recuperação de senha.**
- **Consistência entre donos:** o banco não impede, sozinho, uma transação do usuário A apontar para a conta do usuário B. Isso é garantido na camada de serviço (verificar `userId` da conta e da categoria) e deve ser coberto por testes na Etapa 3.
- Auth.js v5 ainda é **beta**; acompanhar a versão estável.
