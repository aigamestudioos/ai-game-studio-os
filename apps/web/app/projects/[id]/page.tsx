"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { AppShell } from "../../../components/layout/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
import { Spinner } from "../../../components/ui/spinner";
import { useProject } from "../../../hooks/use-project";
import { projectStatusLabel } from "../../../lib/project-status";

const STATUS_VARIANT: Record<string, "default" | "warning" | "success" | "outline" | "secondary"> = {
  Rascunho: "outline",
  Planejamento: "secondary",
  "Em desenvolvimento": "default",
  "Em pausa": "warning",
  Concluído: "success",
  Arquivado: "outline",
};

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const { project, epics, error } = useProject(params.id);

  if (project === null) notFound();

  if (project === undefined) {
    return (
      <AppShell breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Projects", href: "/projects" }]}>
        <div className="flex justify-center py-2xl">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  const statusLabel = projectStatusLabel(project.status);

  return (
    <AppShell
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Projects", href: "/projects" }, { label: project.name }]}
    >
      <div className="space-y-lg p-lg">
        <section className="flex items-start justify-between gap-sm">
          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <Badge variant={STATUS_VARIANT[statusLabel] ?? "outline"}>{statusLabel}</Badge>
            </div>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="space-y-lg lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Epics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-sm">
                {epics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum epic cadastrado ainda.</p>
                ) : (
                  epics.map((epic) => {
                    const done = epic.status === "COMPLETED";
                    return (
                      <div key={epic.id} className="flex items-center gap-sm text-sm">
                        {done ? (
                          <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
                        ) : (
                          <Circle className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
                        )}
                        <span className={done ? "text-muted-foreground line-through" : undefined}>{epic.title}</span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-lg">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progresso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-sm">
                <Progress value={project.progress} />
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>{project.progress}%</span>
                  <span>Atualizado {new Date(project.updated_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
