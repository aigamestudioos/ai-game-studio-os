"use client";

import { CheckCircle2, Circle, Rocket, XCircle } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { AppShell } from "../../../components/layout/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { SubmissionStatus } from "../../../lib/publishing-store";
import { useSubmission } from "../../../lib/publishing-store";

const STATUS_VARIANT: Record<SubmissionStatus, "default" | "warning" | "success" | "destructive"> = {
  "Em análise": "default",
  Aprovado: "success",
  Rejeitado: "destructive",
  Publicado: "success",
};

const STATUS_ICON: Record<SubmissionStatus, typeof CheckCircle2> = {
  "Em análise": Circle,
  Aprovado: CheckCircle2,
  Rejeitado: XCircle,
  Publicado: Rocket,
};

const STATUS_COLOR: Record<SubmissionStatus, string> = {
  "Em análise": "text-text-tertiary",
  Aprovado: "text-success",
  Rejeitado: "text-destructive",
  Publicado: "text-success",
};

export default function SubmissionDetailsPage() {
  const params = useParams<{ id: string }>();
  const submission = useSubmission(params.id);

  if (!submission) notFound();

  return (
    <AppShell
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Publishing", href: "/publishing" },
        { label: submission.gameName },
      ]}
    >
      <div className="space-y-lg p-lg">
        <section className="flex items-start justify-between gap-sm">
          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <h1 className="text-2xl font-semibold">{submission.gameName}</h1>
              <Badge variant={STATUS_VARIANT[submission.status]}>{submission.status}</Badge>
            </div>
            <p className="text-muted-foreground">
              {submission.store} — v{submission.version}
            </p>
          </div>
        </section>

        <Card className="lg:max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Histórico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-sm">
            {submission.history.map((event, index) => {
              const Icon = STATUS_ICON[event.status];
              return (
                <div key={`${event.status}-${index}`} className="flex items-center gap-sm text-sm">
                  <Icon className={`size-4 shrink-0 ${STATUS_COLOR[event.status]}`} aria-hidden="true" />
                  <span className="font-medium">{event.status}</span>
                  <span className="ml-auto shrink-0 text-xs text-text-tertiary">{event.date}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
