import { z } from "zod";

/**
 * Variáveis de ambiente validadas na inicialização do servidor.
 * Se algo estiver faltando, falhamos cedo com uma mensagem clara
 * em vez de quebrar em runtime.
 *
 * Este arquivo é puro (não lê process.env) para poder ser testado. A instância
 * pronta para uso está em `env.ts`.
 */
const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET deve ter ao menos 32 caracteres"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${details}`);
  }
  return result.data;
}
