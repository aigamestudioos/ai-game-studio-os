"use client";

import { Rocket } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AppShell } from "../../components/layout/app-shell";
import { SubmissionCard } from "../../components/publishing/cards";
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
import { toast } from "../../hooks/use-toast";
import { addSubmission, useSubmissions, type SubmissionStore } from "../../lib/publishing-store";
import { cn } from "../../lib/utils";

const ALL_STORES: SubmissionStore[] = ["App Store", "Google Play", "Steam"];

export default function PublishingPage() {
  const submissions = useSubmissions();
  const [open, setOpen] = useState(false);
  const [gameName, setGameName] = useState("");
  const [version, setVersion] = useState("");
  const [store, setStore] = useState<SubmissionStore>("App Store");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gameName.trim() || !version.trim()) return;

    const submission = addSubmission({ gameName: gameName.trim(), version: version.trim(), store });
    toast({
      title: "Submissão criada",
      description: `${submission.gameName} enviado para revisão na ${submission.store}.`,
      variant: "success",
    });
    setGameName("");
    setVersion("");
    setStore("App Store");
    setOpen(false);
  }

  return (
    <AppShell breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Publishing" }]}>
      <div className="space-y-lg p-lg">
        <section className="flex items-center justify-between gap-sm">
          <div>
            <h1 className="text-2xl font-semibold">Publishing</h1>
            <p className="text-muted-foreground">Publique seus jogos nas plataformas.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Rocket className="mr-sm size-4" aria-hidden="true" />
                New Submission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Nova Submissão</DialogTitle>
                  <DialogDescription>
                    Envie uma build para revisão em uma das lojas.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-md">
                  <div className="space-y-sm">
                    <label htmlFor="submission-game" className="text-sm font-medium">
                      Jogo
                    </label>
                    <Input
                      id="submission-game"
                      value={gameName}
                      onChange={(event) => setGameName(event.target.value)}
                      placeholder="Ex.: Nebula Drift"
                      required
                    />
                  </div>
                  <div className="space-y-sm">
                    <label htmlFor="submission-version" className="text-sm font-medium">
                      Versão
                    </label>
                    <Input
                      id="submission-version"
                      value={version}
                      onChange={(event) => setVersion(event.target.value)}
                      placeholder="Ex.: 1.0.0"
                      required
                    />
                  </div>
                  <div className="space-y-sm">
                    <span className="text-sm font-medium">Loja</span>
                    <div className="flex flex-wrap gap-sm">
                      {ALL_STORES.map((option) => {
                        const selected = option === store;
                        return (
                          <button key={option} type="button" onClick={() => setStore(option)} aria-pressed={selected}>
                            <Badge
                              variant={selected ? "default" : "outline"}
                              className={cn("cursor-pointer select-none", !selected && "text-muted-foreground")}
                            >
                              {option}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit">Criar Submissão</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        <section className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <Link key={submission.id} href={`/publishing/${submission.id}`} className="block">
              <SubmissionCard
                gameName={submission.gameName}
                store={submission.store}
                version={submission.version}
                status={submission.status}
                updatedAt={submission.updatedAt}
              />
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
