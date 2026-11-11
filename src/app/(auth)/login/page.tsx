import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Entrar no FinTrack</CardTitle>
        <CardDescription>Acesse suas finanças.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="text-primary underline-offset-4 hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
