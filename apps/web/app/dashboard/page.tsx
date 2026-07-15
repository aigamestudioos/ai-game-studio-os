"use client";

import { Gamepad2, HardDrive, Rocket, Sparkles } from "lucide-react";
import { ProjectCard, StatCard } from "../../components/dashboard/cards";
import { Sidebar } from "../../components/layout/sidebar";
import { TopBar } from "../../components/layout/topbar";
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

const RECENT_PROJECTS = [
  {
    name: "Project Alpha",
    description: "Puzzle mobile — protótipo em desenvolvimento.",
    status: "Em desenvolvimento" as const,
  },
  {
    name: "Project Beta",
    description: "Runner casual — aguardando revisão de arte.",
    status: "Em revisão" as const,
  },
  {
    name: "Project Gamma",
    description: "Hyper-casual — publicado nas lojas.",
    status: "Publicado" as const,
  },
];

const STATISTICS = [
  { label: "Games", value: "3", icon: Gamepad2 },
  { label: "Assets", value: "128", icon: HardDrive },
  { label: "AI Credits", value: "4.200", icon: Sparkles },
  { label: "Publishing", value: "1 ativo", icon: Rocket },
];

export default function DashboardPage() {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active="Dashboard" />

        <main className="flex-1 space-y-lg overflow-y-auto p-lg">
          <section className="space-y-md">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">Recent Projects</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">+ New Project</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo projeto</DialogTitle>
                    <DialogDescription>
                      Tela apenas visual — sem persistência ainda (entra no Incremento 0.8).
                    </DialogDescription>
                  </DialogHeader>
                  <Input placeholder="Nome do projeto" />
                  <DialogFooter>
                    <Button variant="outline">Cancelar</Button>
                    <Button>Criar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
              {RECENT_PROJECTS.map((project) => (
                <ProjectCard key={project.name} {...project} />
              ))}
            </div>
          </section>

          <section className="space-y-md">
            <h2 className="text-lg font-semibold">Statistics</h2>

            <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
              {STATISTICS.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
