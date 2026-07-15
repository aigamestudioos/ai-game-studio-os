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
import { Textarea } from "../../components/ui/textarea";
import { toast } from "../../hooks/use-toast";
import { addProject, useProjects } from "../../lib/projects-store";

export default function ProjectsPage() {
  const projects = useProjects();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    const project = addProject({ name: name.trim(), description: description.trim() });
    toast({ title: "Projeto criado", description: `${project.name} foi adicionado.`, variant: "success" });
    setName("");
    setDescription("");
    setOpen(false);
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
              <Button>
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
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit">Criar Project</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        <section className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block">
              <ProjectCard
                name={project.name}
                description={project.description}
                status={project.status}
                progress={project.progress}
                updatedAt={project.updatedAt}
              />
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
