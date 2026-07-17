"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Progress } from "../../components/ui/progress";
import { Spinner } from "../../components/ui/spinner";
import { mapAuthError, useAuth } from "../../hooks/use-auth";
import { evaluatePasswordStrength } from "../../lib/password-strength";
import { toast } from "../../hooks/use-toast";

type LinkState = "exchanging" | "ready" | "invalid";

const STRENGTH_TEXT_COLOR = [
  "text-destructive",
  "text-destructive",
  "text-warning",
  "text-primary",
  "text-success",
];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { exchangeRecoveryCode, establishSessionFromHash, updatePassword, logout } = useAuth();

  const [linkState, setLinkState] = useState<LinkState>("exchanging");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      // Formato PKCE (esperado do fluxo real de resetPasswordForEmail).
      exchangeRecoveryCode(code)
        .then(() => setLinkState("ready"))
        .catch(() => setLinkState("invalid"));
      return;
    }

    // Formato antigo (implicit grant): `#access_token=...&type=recovery` no
    // fragmento da URL. O client de @supabase/ssr não detecta isso sozinho,
    // então lemos o hash manualmente e chamamos setSession().
    if (window.location.hash.includes("access_token")) {
      establishSessionFromHash(window.location.hash)
        .then((ok) => setLinkState(ok ? "ready" : "invalid"))
        .catch(() => setLinkState("invalid"));
      // Remove os tokens da URL/histórico do navegador depois de lidos.
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }

    setLinkState("invalid");
    // Roda uma única vez — nem exchangeRecoveryCode nem establishSessionFromHash
    // são memoizadas, e o link (código/token) só pode ser trocado uma vez.
  }, [searchParams]);

  const strength = evaluatePasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!strength.meetsMinimum) {
      setError("A senha precisa ter pelo menos 8 caracteres, com letras e números.");
      return;
    }
    if (!passwordsMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      toast({ title: "Senha redefinida", description: "Faça login com sua nova senha.", variant: "success" });
      // Encerra a sessão temporária de recovery — redefinir a senha não deve
      // deixar o usuário "logado de brinde" sem passar pelo login de novo.
      await logout();
      router.push("/login");
    } catch (err) {
      setError(mapAuthError(err));
      setLoading(false);
    }
  }

  if (linkState === "exchanging") {
    return (
      <Card className="w-full max-w-[24rem]">
        <CardContent className="flex items-center justify-center py-2xl">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (linkState === "invalid") {
    return (
      <Card className="w-full max-w-[24rem]">
        <CardHeader>
          <CardTitle>Link inválido ou expirado</CardTitle>
          <CardDescription>Este link de recuperação não é mais válido. Solicite um novo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password">
            <Button className="w-full">Solicitar novo link</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[24rem]">
      <CardHeader>
        <CardTitle>Definir nova senha</CardTitle>
        <CardDescription>Escolha uma senha forte para proteger sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-md">
          <div className="space-y-sm">
            <label htmlFor="password" className="text-sm font-medium">
              Nova senha
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
            {password ? (
              <div className="space-y-xs">
                <Progress value={(strength.score / 4) * 100} />
                <p className={`text-xs ${STRENGTH_TEXT_COLOR[strength.score]}`}>{strength.label}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-sm">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmar nova senha
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              disabled={loading}
              state={confirmPassword && !passwordsMatch ? "error" : "default"}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" loading={loading} disabled={loading} className="w-full">
            Redefinir senha
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-lg">
      <Suspense fallback={<Spinner size="lg" />}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
