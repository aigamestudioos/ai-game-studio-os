import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { submissionStatusLabel, submissionStatusVariant } from "../../lib/submission-status";
import type { SubmissionStatus } from "@agsos/database";

export function SubmissionCard({
  gameName,
  platformName,
  versionNumber,
  status,
  updatedAt,
}: {
  gameName: string;
  platformName: string;
  versionNumber: string;
  status: SubmissionStatus;
  updatedAt?: string;
}) {
  return (
    <Card className="transition-transform hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-center justify-between gap-sm">
          <CardTitle className="text-base">{gameName}</CardTitle>
          <Badge variant={submissionStatusVariant(status)}>{submissionStatusLabel(status)}</Badge>
        </div>
        <CardDescription>
          {platformName} — v{versionNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {updatedAt ? <span className="text-xs text-text-tertiary">Atualizado {updatedAt}</span> : null}
      </CardContent>
    </Card>
  );
}
