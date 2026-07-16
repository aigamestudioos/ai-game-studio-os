import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import type { SubmissionStatus, SubmissionStore } from "../../lib/publishing-store";

const STATUS_VARIANT: Record<SubmissionStatus, "default" | "warning" | "success" | "destructive"> = {
  "Em análise": "default",
  Aprovado: "success",
  Rejeitado: "destructive",
  Publicado: "success",
};

export function SubmissionCard({
  gameName,
  store,
  version,
  status,
  updatedAt,
}: {
  gameName: string;
  store: SubmissionStore;
  version: string;
  status: SubmissionStatus;
  updatedAt?: string;
}) {
  return (
    <Card className="transition-transform hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-center justify-between gap-sm">
          <CardTitle className="text-base">{gameName}</CardTitle>
          <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
        </div>
        <CardDescription>
          {store} — v{version}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {updatedAt ? <span className="text-xs text-text-tertiary">Atualizado {updatedAt}</span> : null}
      </CardContent>
    </Card>
  );
}
