import { Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import type { ActivityEntry, RoadmapSnapshot } from "./mock-data";

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      {action}
    </div>
  );
}

export function QuickActionCard({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-sm rounded-lg border border-border bg-card p-lg text-center transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="size-5 text-primary" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export function ActivityItem({ title, description, timestamp }: ActivityEntry) {
  return (
    <div className="flex gap-sm">
      <span className="mt-[0.4rem] size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      <div className="flex-1 space-y-[0.125rem]">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="shrink-0 text-xs text-text-tertiary">{timestamp}</span>
    </div>
  );
}

export function AiInsightsCard({ insights }: { insights: string[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-sm">
          <Sparkles className="size-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">AI Insights</CardTitle>
        </div>
        <CardDescription>Gerado automaticamente a partir da atividade do estúdio.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-sm text-sm">
          {insights.map((insight) => (
            <li key={insight} className="flex gap-sm">
              <span className="text-primary" aria-hidden="true">
                ✦
              </span>
              {insight}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function RoadmapSnapshotCard({ snapshot }: { snapshot: RoadmapSnapshot }) {
  const percent = Math.round((snapshot.completed / snapshot.total) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-sm">
          <CardTitle className="text-base">Roadmap</CardTitle>
          <Badge variant="outline">{snapshot.currentSprint}</Badge>
        </div>
        <CardDescription>
          {snapshot.completed} de {snapshot.total} incrementos concluídos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-sm">
        <Progress value={percent} />
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>{percent}% concluído</span>
          <span>Próximo: {snapshot.nextSprint}</span>
        </div>
      </CardContent>
    </Card>
  );
}
