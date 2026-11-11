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

## Transações, datas e saldo

- **Data de transação é data de calendário**, guardada à meia-noite UTC (`src/lib/dates.ts`). Assim, "31/10" nunca vira "01/11" por causa de fuso. O fuso (`America/Sao_Paulo`) só é usado para saber "que dia/mês é hoje".
- **Mês é um intervalo `[início, fim)`**: o dia 1º do mês seguinte fica de fora. Coberto por testes de fronteira (31/10, 01/11, 30/11, 01/12).
- **"Sobram" no painel** = receitas do mês − despesas do mês. **Saldo total** = saldo inicial das contas + tudo que entrou − tudo que saiu **até o fim do mês exibido**, então navegar para meses antigos mostra o saldo da época.
- **Contas financeiras ficam ocultas na interface.** Toda transação usa a primeira conta ativa do usuário. A estrutura existe no banco para evoluir (várias contas, cartões) sem migração dolorosa.
- **Isolamento por usuário:** todo serviço recebe o `userId` da sessão. Editar ou apagar a transação de outra pessoa responde "não encontrada", igual a um id inexistente. Categoria de outro usuário (ou de tipo diferente) é recusada. Tudo isso tem teste de integração.

## Interface e movimento

Direção: simples, bonita e animada, para responder rápido "como está meu mês?" e registrar um gasto em segundos.

- **Uma coluna, sem cartões iguais.** O destaque é o painel do mês (`MonthHero`): a pergunta "quanto ainda posso gastar?" com uma barra do quanto do que entrou já foi gasto.
- **Movimento tem função:** uma sequência ao abrir o painel (valor contando, barra enchendo); depois, só movimento que responde a uma ação (trocar de mês, abrir o formulário, adicionar/remover item). `prefers-reduced-motion` é respeitado.
- **Celular em primeiro lugar:** barra de abas com botão "+" ao alcance do polegar; o formulário é uma folha que sobe da base.
- **Valor digitado estilo caixa registradora** (digita-se só números; os centavos se ajustam).
- **Fontes:** Bricolage Grotesque (títulos e valores) e Geist (texto). **Cores:** azul-ultramar da marca; verde e vermelho **escurecidos** para passar contraste AA em texto pequeno.
- **Armadilha evitada:** controles com `layoutId` (pílula deslizante) tremiam quando o diálogo se recentralizava. A pílula do `Segmented` é posicionada pelo índice da opção, não medida na tela.

## Planejamento (orçamento semanal, simulador e investimentos)

- **Orçamento semanal** (`features/dashboard/budget.ts`): o que sobra do mês (entrou − saiu até agora) dividido pelos dias que faltam, contando hoje. A "semana" nunca passa do que sobra e, sem sobra, tudo é zero. Aparece só no mês atual.
- **Simulador** (`features/planning/projection.ts`): aporte no fim de cada mês, juros compostos com **taxa mensal equivalente** à anual (não anual ÷ 12). Valores nominais e sem imposto; mostramos também o valor em dinheiro de hoje (desconto de inflação). Testado contra a fórmula fechada de valor futuro.
- **Sugestão de quanto guardar** usa a média dos últimos 3 meses **completos**, contando só meses com movimento (quem começou há 1 mês não tem a média diluída). Sem histórico completo, usa o mês atual e avisa que é parcial.
- **Conteúdo de investimentos é educativo** (`features/planning/learn.ts`). Regras: descreve **tipos** de investimento (nunca recomenda produto ou instituição), não promete rentabilidade, não detalha imposto (muda com frequência) e sempre exibe o aviso de que não é recomendação.
- **Taxas são hipóteses editáveis.** A única referência de mercado (Selic 13,75% ao ano em 04/11/2026; inflação de 5% ao ano) fica em `REFERENCE`, **datada**, com link para o Banco Central. É um dado que envelhece: revisar a cada mudança relevante.
- **Fora do escopo por enquanto:** salvar metas no banco (virá com "Metas financeiras") e descontar imposto de renda por produto.

## Limitações conhecidas (a tratar nas próximas etapas)

- **Sem limite de tentativas de login** (rate limiting). Necessário antes de uso real.
- **Sem verificação de e-mail nem recuperação de senha.**
- **Consistência entre donos:** o banco não impede, sozinho, uma transação do usuário A apontar para a conta do usuário B. Isso é garantido na camada de serviço (verificar `userId` da conta e da categoria) e deve ser coberto por testes na Etapa 3.
- Auth.js v5 ainda é **beta**; acompanhar a versão estável.
