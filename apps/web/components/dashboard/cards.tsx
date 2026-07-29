import type { LucideIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";

// Solto para `string` (não uma união literal fechada) desde o Sprint 2.0 —
// Dashboard/Playground continuam passando os 3 rótulos mock originais, mas
// Projects (dados reais) agora passa rótulos derivados do enum `project_status`
// do banco (ver apps/web/lib/project-status.ts). Fallback "outline" para
// qualquer rótulo não mapeado, em vez de travar o tipo numa lista fechada.
export type ProjectStatus = string;

const STATUS_VARIANT: Record<string, "default" | "warning" | "success" | "outline" | "secondary"> = {
  "Em desenvolvimento": "default",
  "Em revisão": "warning",
  Publicado: "success",
  Rascunho: "outline",
  Planejamento: "secondary",
  "Em pausa": "warning",
  Concluído: "success",
  Arquivado: "outline",
};

export function ProjectCard({
  name,
  description,
  status,
  progress,
  updatedAt,
}: {
  name: string;
  description: string;
  status: ProjectStatus;
  progress?: number;
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
      {progress !== undefined ? (
        <CardContent className="space-y-sm">
          <Progress value={progress} />
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>{progress}%</span>
            {updatedAt ? <span>Atualizado {updatedAt}</span> : null}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-md pt-lg">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary">
          <Icon className="size-5 text-secondary-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
