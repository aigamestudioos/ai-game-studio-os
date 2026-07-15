import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import type { DocumentStatus, DocumentType } from "../../lib/knowledge-store";

const STATUS_VARIANT: Record<DocumentStatus, "warning" | "success"> = {
  Rascunho: "warning",
  Publicado: "success",
};

export function DocumentCard({
  title,
  summary,
  type,
  status,
  updatedAt,
}: {
  title: string;
  summary: string;
  type: DocumentType;
  status: DocumentStatus;
  updatedAt?: string;
}) {
  return (
    <Card className="transition-transform hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-center justify-between gap-sm">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
        </div>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-sm">
        <Badge variant="outline">{type}</Badge>
        {updatedAt ? <span className="text-xs text-text-tertiary">Atualizado {updatedAt}</span> : null}
      </CardContent>
    </Card>
  );
}
