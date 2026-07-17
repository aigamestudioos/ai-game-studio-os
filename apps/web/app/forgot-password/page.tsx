"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { mapAuthError, useAuth } from "../../hooks/use-auth";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email) {
      setError("Informe seu email.");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email);
      // Sempre mostra sucesso, mesmo que o email não exista — evita revelar
      // quais emails têm conta cadastrada.
      setSent(true);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-lg">
      <Card className="w-full max-w-[24rem]">
        <CardHeader>
          <CardTitle>Esqueceu sua senha?</CardTitle>
          <CardDescription>
            {sent
              ? "Verifique sua caixa de entrada."
              : "Informe seu email e enviaremos um link para redefinir sua senha."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-md">
              <p className="text-sm text-foreground">
                Se <strong>{email}</strong> tiver uma conta no AI Game Studio OS, você vai receber um email com um
                link para redefinir sua senha em alguns instantes.
              </p>
              <Link href="/login" className="text-sm text-primary hover:underline">
                ← Voltar para o login
              </Link>
            </div>
          ) : (
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
                  state={error ? "error" : "default"}
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" loading={loading} disabled={loading} className="w-full">
                Enviar link de recuperação
              </Button>

              <Link
                href="/login"
                className="block text-center text-sm text-muted-foreground hover:text-foreground"
              >
                ← Voltar para o login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
