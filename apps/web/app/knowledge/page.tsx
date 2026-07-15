"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { DocumentCard } from "../../components/knowledge/cards";
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
import { addDocument, useDocuments, type DocumentType } from "../../lib/knowledge-store";
import { cn } from "../../lib/utils";

const ALL_TYPES: DocumentType[] = ["Documento", "Template", "Playbook", "SOP", "ADR", "SPEC"];

export default function KnowledgePage() {
  const documents = useDocuments();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState<DocumentType>("Documento");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    const document = addDocument({ title: title.trim(), summary: summary.trim(), type });
    toast({ title: "Documento criado", description: `${document.title} foi adicionado.`, variant: "success" });
    setTitle("");
    setSummary("");
    setType("Documento");
    setOpen(false);
  }

  return (
    <AppShell breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Knowledge" }]}>
      <div className="space-y-lg p-lg">
        <section className="flex items-center justify-between gap-sm">
          <div>
            <h1 className="text-2xl font-semibold">Knowledge</h1>
            <p className="text-muted-foreground">Centralize o conhecimento do estúdio.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <BookOpen className="mr-sm size-4" aria-hidden="true" />
                New Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Novo Documento</DialogTitle>
                  <DialogDescription>
                    Adicione um documento à base de conhecimento do estúdio.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-md">
                  <div className="space-y-sm">
                    <label htmlFor="doc-title" className="text-sm font-medium">
                      Título
                    </label>
                    <Input
                      id="doc-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Ex.: Guia de Publicação"
                      required
                    />
                  </div>
                  <div className="space-y-sm">
                    <label htmlFor="doc-summary" className="text-sm font-medium">
                      Resumo
                    </label>
                    <Textarea
                      id="doc-summary"
                      value={summary}
                      onChange={(event) => setSummary(event.target.value)}
                      placeholder="Do que se trata este documento?"
                    />
                  </div>
                  <div className="space-y-sm">
                    <span className="text-sm font-medium">Tipo</span>
                    <div className="flex flex-wrap gap-sm">
                      {ALL_TYPES.map((option) => {
                        const selected = option === type;
                        return (
                          <button key={option} type="button" onClick={() => setType(option)} aria-pressed={selected}>
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
                  <Button type="submit">Criar Documento</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        <section className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <Link key={document.id} href={`/knowledge/${document.id}`} className="block">
              <DocumentCard
                title={document.title}
                summary={document.summary}
                type={document.type}
                status={document.status}
                updatedAt={document.updatedAt}
              />
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
