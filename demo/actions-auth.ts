/**
 * Substitui `features/auth/server/actions.ts` na demonstração: mesmas assinaturas e mensagens,
 * mas falando com o armazenamento do navegador em vez do Auth.js + PostgreSQL.
 */
import { z } from "zod";

import { loginSchema, registerSchema } from "@/features/auth/schemas";
import type { FormState } from "@/features/auth/server/actions";

import { EmailTakenError } from "./data";
import { navigate } from "./router";
import { signIn, signOut, signUp } from "./store";

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = { email: text(formData, "email"), password: text(formData, "password") };
  const values = { email: raw.email };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  if (!(await signIn(parsed.data)))
    return { error: "E-mail ou senha incorretos", values };

  navigate("/dashboard");
  return undefined;
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
  };
  const values = { name: raw.name, email: raw.email };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  try {
    await signUp(parsed.data);
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return { fieldErrors: { email: [error.message] }, values };
    }
    throw error;
  }

  navigate("/dashboard");
  return undefined;
}

export async function logoutAction() {
  signOut();
  navigate("/login");
}
