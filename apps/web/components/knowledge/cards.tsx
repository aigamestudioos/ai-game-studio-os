import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

// Solto para `string` desde o Sprint 2.2 — mesmo padrão de ProjectCard/GameCard.
const STATUS_VARIANT: Record<string, "default" | "warning" | "success" | "outline" | "secondary" | "destructive"> = {
  Rascunho: "warning",
  "Em revisão": "secondary",
  Aprovado: "default",
  Publicado: "success",
  Obsoleto: "destructive",
  Arquivado: "outline",
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
  type: string;
  status: string;
  updatedAt?: string;
}) {
  return (
    <Card className="transition-transform hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-center justify-between gap-sm">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant={STATUS_VARIANT[status] ?? "outline"}>{status}</Badge>
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
