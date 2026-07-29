"use client";

import { FolderPlus } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ProjectCard } from "../../components/dashboard/cards";
import { AppShell } from "../../components/layout/app-shell";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Spinner } from "../../components/ui/spinner";
import { Textarea } from "../../components/ui/textarea";
import { useAuth } from "../../hooks/use-auth";
import { useCurrentStudio } from "../../hooks/use-current-studio";
import { useProjects } from "../../hooks/use-projects";
import { toast } from "../../hooks/use-toast";
import { projectStatusLabel } from "../../lib/project-status";

export default function ProjectsPage() {
  const { session } = useAuth();
  const { studio } = useCurrentStudio(session);
  const { projects, error, createProject } = useProjects(session, studio?.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!name.trim()) return;

    setLoading(true);
    try {
      const project = await createProject({ name: name.trim(), description: description.trim() });
      toast({ title: "Projeto criado", description: `${project.name} foi adicionado.`, variant: "success" });
      setName("");
      setDescription("");
      setOpen(false);
    } catch {
      setFormError("Não foi possível criar o projeto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Projects" }]}>
      <div className="space-y-lg p-lg">
        <section className="flex items-center justify-between gap-sm">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="text-muted-foreground">Transforme ideias em produtos executáveis.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!studio}>
                <FolderPlus className="mr-sm size-4" aria-hidden="true" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Novo Project</DialogTitle>
                  <DialogDescription>
                    Crie um novo projeto para começar a organizar epics e tasks.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-md">
                  <div className="space-y-sm">
                    <label htmlFor="project-name" className="text-sm font-medium">
                      Nome
                    </label>
                    <Input
                      id="project-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ex.: Project Delta"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-sm">
                    <label htmlFor="project-description" className="text-sm font-medium">
                      Descrição
                    </label>
                    <Textarea
                      id="project-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Do que se trata este projeto?"
                      disabled={loading}
                    />
                  </div>
                  {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
                </div>

                <DialogFooter>
                  <Button type="submit" loading={loading} disabled={loading}>
                    Criar Project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!projects ? (
          <div className="flex justify-center py-2xl">
            <Spinner size="lg" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum projeto ainda — crie o primeiro acima.</p>
        ) : (
          <section className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block">
                <ProjectCard
                  name={project.name}
                  description={project.description ?? ""}
                  status={projectStatusLabel(project.status)}
                  progress={project.progress}
                />
              </Link>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
