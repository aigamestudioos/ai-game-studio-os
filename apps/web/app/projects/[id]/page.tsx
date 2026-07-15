"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import type { ProjectStatus } from "../../../components/dashboard/cards";
import { AppShell } from "../../../components/layout/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
import { useProject } from "../../../lib/projects-store";

const STATUS_VARIANT: Record<ProjectStatus, "default" | "warning" | "success"> = {
  "Em desenvolvimento": "default",
  "Em revisão": "warning",
  Publicado: "success",
};

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const project = useProject(params.id);

  if (!project) notFound();

  return (
    <AppShell
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Projects", href: "/projects" }, { label: project.name }]}
    >
      <div className="space-y-lg p-lg">
        <section className="flex items-start justify-between gap-sm">
          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <Badge variant={STATUS_VARIANT[project.status]}>{project.status}</Badge>
            </div>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="space-y-lg lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Epics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-sm">
                {project.epics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum epic cadastrado ainda.</p>
                ) : (
                  project.epics.map((epic) => (
                    <div key={epic.id} className="flex items-center gap-sm text-sm">
                      {epic.done ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
                      )}
                      <span className={epic.done ? "text-muted-foreground line-through" : undefined}>
                        {epic.title}
                      </span>
                    </div>
                  ))
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
                  <span>Atualizado {project.updatedAt}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
