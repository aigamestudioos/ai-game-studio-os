"use client";

import { Gamepad2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { GameCard } from "../../components/games/cards";
import { AppShell } from "../../components/layout/app-shell";
import { Badge } from "../../components/ui/badge";
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
import { useGames } from "../../hooks/use-games";
import { useProjects } from "../../hooks/use-projects";
import { toast } from "../../hooks/use-toast";
import { gameStatusLabel } from "../../lib/game-status";
import { cn } from "../../lib/utils";

export default function GamesPage() {
  const { session } = useAuth();
  const { studio } = useCurrentStudio(session);
  const { projects } = useProjects(session, studio?.id);
  const { games, error, createGame } = useGames(session, studio?.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const hasProjects = !!projects && projects.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!name.trim() || !projectId) return;

    setLoading(true);
    try {
      const game = await createGame({ name: name.trim(), description: description.trim(), projectId });
      toast({ title: "Jogo criado", description: `${game.name} foi adicionado.`, variant: "success" });
      setName("");
      setDescription("");
      setProjectId(null);
      setOpen(false);
    } catch {
      setFormError("Não foi possível criar o jogo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Games" }]}>
      <div className="space-y-lg p-lg">
        <section className="flex items-center justify-between gap-sm">
          <div>
            <h1 className="text-2xl font-semibold">Games</h1>
            <p className="text-muted-foreground">Gerencie todo o ciclo de vida dos seus jogos.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!studio || !hasProjects}>
                <Gamepad2 className="mr-sm size-4" aria-hidden="true" />
                Create Game
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Novo Game</DialogTitle>
                  <DialogDescription>
                    Cadastre um novo jogo para começar a gerenciar builds e releases.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-md">
                  <div className="space-y-sm">
                    <label htmlFor="game-name" className="text-sm font-medium">
                      Nome
                    </label>
                    <Input
                      id="game-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ex.: Nebula Drift"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-sm">
                    <label htmlFor="game-description" className="text-sm font-medium">
                      Descrição
                    </label>
                    <Textarea
                      id="game-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Do que se trata este jogo?"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-sm">
                    <span className="text-sm font-medium">Project</span>
                    <div className="flex flex-wrap gap-sm">
                      {(projects ?? []).map((project) => {
                        const selected = projectId === project.id;
                        return (
                          <button
                            key={project.id}
                            type="button"
                            onClick={() => setProjectId(project.id)}
                            aria-pressed={selected}
                          >
                            <Badge
                              variant={selected ? "default" : "outline"}
                              className={cn("cursor-pointer select-none", !selected && "text-muted-foreground")}
                            >
                              {project.name}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Todo Game pertence a um Project — crie um Project primeiro se ainda não tiver nenhum.
                    </p>
                  </div>
                  {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
                </div>

                <DialogFooter>
                  <Button type="submit" loading={loading} disabled={loading || !projectId}>
                    Criar Game
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {studio && !hasProjects ? (
          <p className="text-sm text-muted-foreground">
            Crie um <Link href="/projects" className="text-primary hover:underline">Project</Link> antes de cadastrar
            seu primeiro Game.
          </p>
        ) : null}

        {!games ? (
          <div className="flex justify-center py-2xl">
            <Spinner size="lg" />
          </div>
        ) : games.length === 0 ? (
          hasProjects ? <p className="text-sm text-muted-foreground">Nenhum jogo ainda — crie o primeiro acima.</p> : null
        ) : (
          <section className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`} className="block">
                <GameCard name={game.name} description={game.description ?? ""} status={gameStatusLabel(game.status)} />
              </Link>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
