"use client";

import { Rocket } from "lucide-react";
import Link from "next/link";
import { AppShell } from "../../components/layout/app-shell";
import { SubmissionCard } from "../../components/publishing/cards";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";
import { useAuth } from "../../hooks/use-auth";
import { useCurrentStudio } from "../../hooks/use-current-studio";
import { useSubmissions } from "../../hooks/use-submissions";

export default function PublishingPage() {
  const { session } = useAuth();
  const { studio } = useCurrentStudio(session);
  const { submissions, error } = useSubmissions(session, studio?.id);

  return (
    <AppShell breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Publishing" }]}>
      <div className="space-y-lg p-lg">
        <section className="flex items-center justify-between gap-sm">
          <div>
            <h1 className="text-2xl font-semibold">Publishing</h1>
            <p className="text-muted-foreground">Acompanhe as submissões dos seus jogos nas lojas.</p>
          </div>

          <Button disabled title="Nenhum Release disponível ainda">
            <Rocket className="mr-sm size-4" aria-hidden="true" />
            New Submission
          </Button>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <p className="text-sm text-muted-foreground">
          Uma Submissão exige um Release já existente. Ainda não há UI para criar Releases/Builds — assim que esse
          fluxo existir, "New Submission" será habilitado aqui.
        </p>

        {!submissions ? (
          <div className="flex justify-center py-2xl">
            <Spinner size="lg" />
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma submissão ainda.</p>
        ) : (
          <section className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
            {submissions.map((submission) => (
              <Link key={submission.id} href={`/publishing/${submission.id}`} className="block">
                <SubmissionCard
                  gameName={submission.gameName}
                  platformName={submission.platformName}
                  versionNumber={submission.versionNumber}
                  status={submission.status}
                  updatedAt={new Date(submission.updatedAt).toLocaleDateString("pt-BR")}
                />
              </Link>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
