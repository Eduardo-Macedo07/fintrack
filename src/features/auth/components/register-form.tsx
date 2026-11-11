"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { registerAction } from "../server/actions";
import { Field } from "./field";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <form action={action} className="grid gap-4" noValidate>
      <Field
        name="name"
        label="Nome"
        autoComplete="name"
        defaultValue={state?.values?.name}
        errors={state?.fieldErrors?.name}
        required
      />
      <Field
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        defaultValue={state?.values?.email}
        errors={state?.fieldErrors?.email}
        required
      />
      <Field
        name="password"
        label="Senha"
        type="password"
        autoComplete="new-password"
        errors={state?.fieldErrors?.password}
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  );
}
