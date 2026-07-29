"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { KnowledgeDocumentType } from "@agsos/database";
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
import { Spinner } from "../../components/ui/spinner";
import { Textarea } from "../../components/ui/textarea";
import { useAuth } from "../../hooks/use-auth";
import { useCurrentStudio } from "../../hooks/use-current-studio";
import { useKnowledgeDocuments } from "../../hooks/use-knowledge-documents";
import { toast } from "../../hooks/use-toast";
import { KNOWLEDGE_TYPES, knowledgeTypeLabel } from "../../lib/knowledge-type";
import { knowledgeStatusLabel } from "../../lib/knowledge-status";
import { cn } from "../../lib/utils";

export default function KnowledgePage() {
  const { session } = useAuth();
  const { studio } = useCurrentStudio(session);
  const { documents, error, createDocument } = useKnowledgeDocuments(session, studio?.id);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState<KnowledgeDocumentType>("TECHNICAL_DOCUMENT");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!title.trim()) return;

    setLoading(true);
    try {
      const document = await createDocument({ title: title.trim(), summary: summary.trim(), type });
      toast({ title: "Documento criado", description: `${document.title} foi adicionado.`, variant: "success" });
      setTitle("");
      setSummary("");
      setType("TECHNICAL_DOCUMENT");
      setOpen(false);
    } catch {
      setFormError("Não foi possível criar o documento. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
              <Button disabled={!studio}>
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-sm">
                    <span className="text-sm font-medium">Tipo</span>
                    <div className="flex flex-wrap gap-sm">
                      {KNOWLEDGE_TYPES.map((option) => {
                        const selected = option === type;
                        return (
                          <button key={option} type="button" onClick={() => setType(option)} aria-pressed={selected}>
                            <Badge
                              variant={selected ? "default" : "outline"}
                              className={cn("cursor-pointer select-none", !selected && "text-muted-foreground")}
                            >
                              {knowledgeTypeLabel(option)}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
                </div>

                <DialogFooter>
                  <Button type="submit" loading={loading} disabled={loading}>
                    Criar Documento
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!documents ? (
          <div className="flex justify-center py-2xl">
            <Spinner size="lg" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum documento ainda — crie o primeiro acima.</p>
        ) : (
          <section className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
            {documents.map(({ document, summary: docSummary }) => (
              <Link key={document.id} href={`/knowledge/${document.id}`} className="block">
                <DocumentCard
                  title={document.title}
                  summary={docSummary ?? ""}
                  type={knowledgeTypeLabel(document.type)}
                  status={knowledgeStatusLabel(document.status)}
                />
              </Link>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
