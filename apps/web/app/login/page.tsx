"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { mapAuthError, useAuth } from "../../hooks/use-auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Informe email e senha.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      const redirect = searchParams.get("redirect") ?? "/dashboard";
      router.push(redirect);
    } catch (err) {
      setError(mapAuthError(err));
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-[24rem]">
      <CardHeader>
        <CardTitle>Entrar no AI Game Studio OS</CardTitle>
        <CardDescription>Use seu email e senha para acessar seu estúdio.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-md">
          <div className="space-y-sm">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="voce@estudio.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="space-y-sm">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              state={error ? "error" : "default"}
              disabled={loading}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" loading={loading} disabled={loading} className="w-full">
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-lg">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <Link href="/" className="fixed left-lg top-lg text-sm text-muted-foreground hover:text-foreground">
        ← Voltar para a home
      </Link>
    </main>
  );
}
