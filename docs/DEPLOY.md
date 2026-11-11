# Publicar o FinTrack na internet

Com isso você abre o app por um endereço (`https://...vercel.app`) no celular ou no computador, sem rodar nada na sua máquina. Leva uns 10 minutos e dá para usar só contas gratuitas.

Você vai precisar de duas contas, que podem ser criadas entrando com o GitHub:

- **Neon** (banco de dados PostgreSQL): <https://neon.tech>
- **Vercel** (hospedagem do app): <https://vercel.com>

> Os nomes de botões abaixo podem mudar com o tempo. A ideia de cada passo continua a mesma.

## 1. Criar o banco (Neon)

1. Crie um projeto novo. Se puder escolher a região, prefira a mais próxima de você (ex.: São Paulo).
2. Na tela de conexão, copie a **connection string** do PostgreSQL. Ela começa com `postgresql://` e termina com `?sslmode=require`.
3. Use a versão **sem pool** ("direct", com a opção _Connection pooling_ desligada). O build cria as tabelas por essa conexão, e conexões com pool podem atrapalhar essa etapa.

## 2. Gerar o segredo de login

Você precisa de um texto aleatório de **pelo menos 32 caracteres**. Pode ser gerado pelo gerenciador de senhas do celular, ou no computador:

```bash
openssl rand -base64 32
```

Guarde esse valor: é o `AUTH_SECRET`. **Não compartilhe nem commite.**

## 3. Publicar (Vercel)

1. Em _Add New → Project_, importe o repositório `fintrack` do GitHub.
2. Em **Environment Variables**, crie duas variáveis (valem para Production, Preview e Development):

   | Nome           | Valor                                 |
   | -------------- | ------------------------------------- |
   | `DATABASE_URL` | a connection string do Neon (passo 1) |
   | `AUTH_SECRET`  | o texto aleatório (passo 2)           |

   Não crie `AUTH_TRUST_HOST`: na Vercel o Auth.js já confia no endereço.

3. Clique em **Deploy**. O projeto tem o script `vercel-build`, que **cria as tabelas no banco** e depois monta o app (`prisma migrate deploy && next build`). Se o banco estiver errado, o build falha com a mensagem do Prisma.
4. Quando terminar, a Vercel mostra o endereço. Abra, clique em **Cadastre-se** e crie a sua conta.

A conta de demonstração (`demo@fintrack.dev`) **não existe na internet** de propósito: o `npm run db:seed` se recusa a rodar fora de um banco local, para não deixar uma senha pública num banco de verdade.

## Antes de usar de verdade

Hoje o app **ainda não tem** limite de tentativas de login, verificação de e-mail nem recuperação de senha, e qualquer pessoa que descobrir o endereço pode criar uma conta. Para testar, use **dados de mentira**. Esses itens estão na lista de limitações em `docs/ARCHITECTURE.md`.

## O que já foi verificado e o que não

- Verificado: o `vercel-build` roda de ponta a ponta localmente, e a migração cria as tabelas e permite cadastrar usuário num banco **vazio**.
- **Não verificado:** o deploy real na Vercel e a conexão com o Neon, porque dependem das suas contas. Se algo falhar, copie a mensagem de erro do build (aba _Deployments_ → o deploy → _Build Logs_).
