"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { prisma } from "@/server/db";
import { signIn, signOut } from "@/server/auth";

import { loginSchema, registerSchema } from "../schemas";
import { EmailTakenError, registerUser } from "./register";

export type FormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string[] | undefined>;
      /** Devolvemos o que foi digitado (exceto a senha) para o formulário não ser limpo. */
      values?: { name?: string; email?: string };
    }
  | undefined;

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

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
  } catch (error) {
    // Em caso de sucesso o signIn lança um redirect, que precisa seguir adiante.
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha incorretos", values };
    }
    throw error;
  }
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
    await registerUser(prisma, parsed.data);
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return { fieldErrors: { email: [error.message] }, values };
    }
    throw error;
  }

  // Já entra logado depois de cadastrar.
  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
