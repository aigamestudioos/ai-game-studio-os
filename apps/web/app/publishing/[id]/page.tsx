"use client";

import { notFound, useParams } from "next/navigation";
import { AppShell } from "../../../components/layout/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Spinner } from "../../../components/ui/spinner";
import { useSubmission } from "../../../hooks/use-submission";
import { submissionStatusLabel, submissionStatusVariant } from "../../../lib/submission-status";

export default function SubmissionDetailsPage() {
  const params = useParams<{ id: string }>();
  const { submission, reviews, error } = useSubmission(params.id);

  if (submission === undefined) {
    return (
      <AppShell breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Publishing", href: "/publishing" }]}>
        <div className="flex justify-center py-2xl">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  if (submission === null) notFound();

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
              <Badge variant={submissionStatusVariant(submission.status)}>{submissionStatusLabel(submission.status)}</Badge>
            </div>
            <p className="text-muted-foreground">
              {submission.platformName} — v{submission.versionNumber}
            </p>
          </div>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Card className="lg:max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Revisões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-sm">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma revisão registrada ainda.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="space-y-1 border-b border-border pb-sm last:border-0 last:pb-0">
                  <div className="flex items-center gap-sm text-sm">
                    <span className="font-medium">
                      {review.decision ? submissionStatusLabel(review.decision) : "Sem decisão"}
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-text-tertiary">
                      {review.reviewed_at ? new Date(review.reviewed_at).toLocaleDateString("pt-BR") : "—"}
                    </span>
                  </div>
                  {review.reviewer_notes ? (
                    <p className="text-sm text-muted-foreground">{review.reviewer_notes}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
