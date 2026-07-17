"use client";

import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { mapAuthError, useAuth } from "../../hooks/use-auth";
import { evaluatePasswordStrength } from "../../lib/password-strength";
import { toast } from "../../hooks/use-toast";

const STRENGTH_TEXT_COLOR = [
  "text-destructive",
  "text-destructive",
  "text-warning",
  "text-primary",
  "text-success",
];

export function SecuritySection() {
  const { updatePassword, signOutEverywhere, logout } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOutEverywhere, setSigningOutEverywhere] = useState(false);

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
      toast({ title: "Senha alterada", variant: "success" });
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOutEverywhere() {
    setSigningOutEverywhere(true);
    try {
      await signOutEverywhere();
      toast({ title: "Sessões encerradas", description: "Você foi desconectado de todos os dispositivos." });
      await logout();
    } catch {
      toast({ title: "Não foi possível encerrar as sessões", variant: "destructive" });
      setSigningOutEverywhere(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segurança</CardTitle>
        <CardDescription>Altere sua senha ou encerre sessões em outros dispositivos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-lg">
        <form onSubmit={handleSubmit} className="space-y-md">
          <div className="space-y-sm">
            <label htmlFor="newPassword" className="text-sm font-medium">
              Nova senha
            </label>
            <Input
              id="newPassword"
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
            <label htmlFor="confirmNewPassword" className="text-sm font-medium">
              Confirmar nova senha
            </label>
            <Input
              id="confirmNewPassword"
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

          <Button type="submit" loading={loading} disabled={loading}>
            Alterar senha
          </Button>
        </form>

        <Separator />

        <div className="space-y-sm">
          <p className="text-sm font-medium">Sessões ativas</p>
          <p className="text-xs text-muted-foreground">
            Encerre sua sessão em todos os dispositivos onde você estiver logado, inclusive este.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOutEverywhere}
            loading={signingOutEverywhere}
            disabled={signingOutEverywhere}
          >
            Sair de todos os dispositivos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
