"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Informe email e senha.");
      return;
    }

    setLoading(true);
    // Mock: sem chamada de rede real ainda (Supabase Auth entra no Incremento 1.7).
    setTimeout(() => {
      login(email, password);
      router.push("/dashboard");
    }, 400);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-lg">
      <Card className="w-full max-w-[24rem]">
        <CardHeader>
          <CardTitle>Entrar no AI Game Studio OS</CardTitle>
          <CardDescription>
            Demonstração — qualquer email e senha entram. Autenticação real chega com o Supabase.
          </CardDescription>
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
              />
            </div>

            <div className="space-y-sm">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                state={error ? "error" : "default"}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" loading={loading} className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link href="/" className="fixed left-lg top-lg text-sm text-muted-foreground hover:text-foreground">
        ← Voltar para a home
      </Link>
    </main>
  );
}
