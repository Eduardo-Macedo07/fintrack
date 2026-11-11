"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { loginAction } from "../server/actions";
import { Field } from "./field";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="grid gap-4" noValidate>
      {state?.error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}
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
        autoComplete="current-password"
        errors={state?.fieldErrors?.password}
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
