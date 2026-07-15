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
import { Textarea } from "../../components/ui/textarea";
import { toast } from "../../hooks/use-toast";
import { addGame, useGames, type GamePlatform } from "../../lib/games-store";
import { cn } from "../../lib/utils";

const ALL_PLATFORMS: GamePlatform[] = ["iOS", "Android", "Steam"];

export default function GamesPage() {
  const games = useGames();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [platforms, setPlatforms] = useState<GamePlatform[]>([]);

  function togglePlatform(platform: GamePlatform) {
    setPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    const game = addGame({ name: name.trim(), description: description.trim(), platforms });
    toast({ title: "Jogo criado", description: `${game.name} foi adicionado.`, variant: "success" });
    setName("");
    setDescription("");
    setPlatforms([]);
    setOpen(false);
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
              <Button>
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
                    />
                  </div>
                  <div className="space-y-sm">
                    <span className="text-sm font-medium">Plataformas</span>
                    <div className="flex flex-wrap gap-sm">
                      {ALL_PLATFORMS.map((platform) => {
                        const selected = platforms.includes(platform);
                        return (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => togglePlatform(platform)}
                            aria-pressed={selected}
                          >
                            <Badge
                              variant={selected ? "default" : "outline"}
                              className={cn("cursor-pointer select-none", !selected && "text-muted-foreground")}
                            >
                              {platform}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit">Criar Game</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        <section className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`} className="block">
              <GameCard
                name={game.name}
                description={game.description}
                status={game.status}
                platforms={game.platforms}
                updatedAt={game.updatedAt}
              />
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
