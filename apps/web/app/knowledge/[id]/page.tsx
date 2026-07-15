"use client";

import { notFound, useParams } from "next/navigation";
import { AppShell } from "../../../components/layout/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { DocumentStatus } from "../../../lib/knowledge-store";
import { useDocument } from "../../../lib/knowledge-store";

const STATUS_VARIANT: Record<DocumentStatus, "warning" | "success"> = {
  Rascunho: "warning",
  Publicado: "success",
};

export default function DocumentDetailsPage() {
  const params = useParams<{ id: string }>();
  const document = useDocument(params.id);

  if (!document) notFound();

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
              <Badge variant={STATUS_VARIANT[document.status]}>{document.status}</Badge>
              <Badge variant="outline">{document.type}</Badge>
            </div>
            <p className="text-muted-foreground">{document.summary}</p>
          </div>
        </section>

        <Card className="lg:max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Conteúdo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground">{document.content}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
