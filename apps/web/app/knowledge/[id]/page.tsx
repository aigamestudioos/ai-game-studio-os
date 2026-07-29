"use client";

import { notFound, useParams } from "next/navigation";
import { AppShell } from "../../../components/layout/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Spinner } from "../../../components/ui/spinner";
import { useKnowledgeDocument } from "../../../hooks/use-knowledge-document";
import { knowledgeStatusLabel } from "../../../lib/knowledge-status";
import { knowledgeTypeLabel } from "../../../lib/knowledge-type";

const STATUS_VARIANT: Record<string, "default" | "warning" | "success" | "outline" | "secondary" | "destructive"> = {
  Rascunho: "warning",
  "Em revisão": "secondary",
  Aprovado: "default",
  Publicado: "success",
  Obsoleto: "destructive",
  Arquivado: "outline",
};

export default function DocumentDetailsPage() {
  const params = useParams<{ id: string }>();
  const { document, version, error } = useKnowledgeDocument(params.id);

  if (document === null) notFound();

  if (document === undefined) {
    return (
      <AppShell breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Knowledge", href: "/knowledge" }]}>
        <div className="flex justify-center py-2xl">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  const statusLabel = knowledgeStatusLabel(document.status);

  return (
    <AppShell
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Knowledge", href: "/knowledge" },
        { label: document.title },
      ]}
    >
      <div className="space-y-lg p-lg">
        <section className="flex items-start justify-between gap-sm">
          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <h1 className="text-2xl font-semibold">{document.title}</h1>
              <Badge variant={STATUS_VARIANT[statusLabel] ?? "outline"}>{statusLabel}</Badge>
              <Badge variant="outline">{knowledgeTypeLabel(document.type)}</Badge>
            </div>
            {version?.summary ? <p className="text-muted-foreground">{version.summary}</p> : null}
          </div>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Card className="lg:max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Conteúdo</CardTitle>
          </CardHeader>
          <CardContent>
            {version ? (
              <p className="whitespace-pre-wrap text-sm text-foreground">{version.content}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma versão publicada ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
