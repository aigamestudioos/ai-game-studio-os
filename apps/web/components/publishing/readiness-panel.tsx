"use client";

import { CheckCircle2, CircleAlert, CircleHelp, XCircle } from "lucide-react";
import Link from "next/link";
import type { ReadinessCheck, ReleaseReadiness } from "@agsos/database";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Spinner } from "../ui/spinner";
import { checkStatusLabel, readinessFixHref, readinessStatusLabel, readinessStatusVariant } from "../../lib/readiness-status";

// Sprint 2.12b — GATE 8: painel "RELEASE READINESS".
//
// Readiness ≠ Submission ≠ Publication: este componente só EXIBE o
// veredito puro devolvido por `get_release_readiness` (Sprint 2.12a) — não
// cria, não envia, não publica nada. `blocking` (não `status === "FAIL"`)
// é o que determina se um check é tratado visualmente como blocker: um
// check WARN nunca é um blocker, e um FAIL cujo catálogo diz
// `blocking = false` também não é (ver readiness_check_entry na migration).
function CheckIcon({ check }: { check: ReadinessCheck }) {
  if (check.status === "NOT_APPLICABLE") return <CircleHelp className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />;
  if (check.status === "WARN") return <CircleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />;
  if (check.status === "PASS") return <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />;
  return <XCircle className={`size-4 shrink-0 ${check.blocking ? "text-destructive" : "text-warning"}`} aria-hidden="true" />;
}

function CheckRow({ check }: { check: ReadinessCheck }) {
  const fixHref = readinessFixHref(check);
  return (
    <li className="flex items-start justify-between gap-sm border-b border-border py-sm last:border-0 last:pb-0">
      <div className="flex items-start gap-sm">
        <CheckIcon check={check} />
        <div className="space-y-1">
          <p className="text-sm">
            {check.message}
            {check.platform ? <span className="ml-sm text-xs text-text-tertiary">({check.platform})</span> : null}
          </p>
          <div className="flex items-center gap-sm">
            <span className="text-xs text-text-tertiary">{checkStatusLabel(check.status)}</span>
            {check.blocking ? (
              <Badge variant="destructive" className="text-[0.65rem]">
                Bloqueia submissão
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
      {fixHref && check.status === "FAIL" ? (
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={fixHref}>Corrigir</Link>
        </Button>
      ) : null}
    </li>
  );
}

export function ReadinessPanel({
  readiness,
  loading,
  error,
  onReload,
}: {
  readiness: ReleaseReadiness | null | undefined;
  loading?: boolean;
  error?: string | null;
  onReload?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-sm">
          <CardTitle className="text-base">Release Readiness</CardTitle>
          {readiness ? (
            <Badge variant={readinessStatusVariant(readiness.status)}>{readinessStatusLabel(readiness.status)}</Badge>
          ) : null}
        </div>
        {onReload ? (
          <Button variant="ghost" size="sm" className="w-fit" onClick={onReload} disabled={loading}>
            Recarregar
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading && readiness === undefined ? (
          <div className="flex justify-center py-lg">
            <Spinner size="md" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !readiness ? (
          <p className="text-sm text-muted-foreground">
            Este Release ainda não tem nenhuma plataforma-alvo (Submission) definida.
          </p>
        ) : readiness.checks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum check de readiness aplicável ainda.</p>
        ) : (
          <ul>
            {readiness.checks.map((check, index) => (
              <CheckRow key={`${check.code}-${check.submissionId ?? "release"}-${check.entityId ?? index}`} check={check} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
