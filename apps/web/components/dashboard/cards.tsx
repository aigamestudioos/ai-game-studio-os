import type { LucideIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export type ProjectStatus = "Em desenvolvimento" | "Em revisão" | "Publicado";

const STATUS_VARIANT: Record<ProjectStatus, "default" | "warning" | "success"> = {
  "Em desenvolvimento": "default",
  "Em revisão": "warning",
  Publicado: "success",
};

export function ProjectCard({
  name,
  description,
  status,
}: {
  name: string;
  description: string;
  status: ProjectStatus;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-sm">
          <CardTitle className="text-base">{name}</CardTitle>
          <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
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
