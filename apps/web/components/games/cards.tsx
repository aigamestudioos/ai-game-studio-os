import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

// Solto para `string` (não uma união literal fechada) desde o Sprint 2.1 —
// mesmo padrão de ProjectStatus em components/dashboard/cards.tsx. GameCard
// só é usado por /games e /games/[id] (nenhum outro consumidor como
// Dashboard/Playground), então não há preocupação de compatibilidade com
// rótulos antigos aqui.
const STATUS_VARIANT: Record<string, "default" | "warning" | "success" | "outline" | "secondary" | "destructive"> = {
  Rascunho: "outline",
  "Em desenvolvimento": "default",
  "Em testes": "secondary",
  "Pronto para lançar": "warning",
  Publicado: "success",
  Suspenso: "destructive",
  Arquivado: "outline",
};

export function GameCard({
  name,
  description,
  status,
  platforms = [],
  updatedAt,
}: {
  name: string;
  description: string;
  status: string;
  platforms?: string[];
  updatedAt?: string;
}) {
  return (
    <Card className="transition-transform hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-center justify-between gap-sm">
          <CardTitle className="text-base">{name}</CardTitle>
          <Badge variant={STATUS_VARIANT[status] ?? "outline"}>{status}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-sm">
        <div className="flex flex-wrap gap-sm">
          {platforms.length === 0 ? (
            <span className="text-xs text-muted-foreground">Sem builds ainda</span>
          ) : (
            platforms.map((platform) => (
              <Badge key={platform} variant="outline">
                {platform}
              </Badge>
            ))
          )}
        </div>
        {updatedAt ? <span className="text-xs text-text-tertiary">Atualizado {updatedAt}</span> : null}
      </CardContent>
    </Card>
  );
}
