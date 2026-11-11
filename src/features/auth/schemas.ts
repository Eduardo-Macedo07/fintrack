import { z } from "zod";

/** E-mail é normalizado (trim + minúsculas) para que "Ana@x.com" e "ana@x.com" sejam o mesmo usuário. */
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Informe um e-mail válido" }));

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter ao menos 2 caracteres")
    .max(80, "O nome deve ter no máximo 80 caracteres"),
  email,
  // bcrypt só considera os primeiros 72 bytes da senha; limitamos para evitar falsa sensação de segurança.
  password: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres")
    .refine((v) => new TextEncoder().encode(v).length <= 72, {
      error: "A senha deve ter no máximo 72 bytes",
    }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe a senha"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
