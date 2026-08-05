"use client";

import { BookOpen, FolderPlus, Gamepad2, Rocket, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectCard, StatCard } from "../../components/dashboard/cards";
import {
  AI_INSIGHTS,
  QUICK_STATS,
  RECENT_ACTIVITY,
  RECENT_PROJECTS,
  ROADMAP_SNAPSHOT,
} from "../../components/dashboard/mock-data";
import {
  ActivityItem,
  AiInsightsCard,
  QuickActionCard,
  RoadmapSnapshotCard,
  SectionHeader,
} from "../../components/dashboard/widgets";
import { AppShell } from "../../components/layout/app-shell";
import { FailedBuildsWidget, LatestBuildsWidget, PendingReleasesWidget } from "../../components/dashboard/pipeline-widgets";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useAuth } from "../../hooks/use-auth";
import { useCurrentStudio } from "../../hooks/use-current-studio";
import { useReleasePipelineWidgets } from "../../hooks/use-release-pipeline-widgets";

const QUICK_ACTIONS = [
  { label: "New Project", icon: FolderPlus },
  { label: "Create Game", icon: Gamepad2 },
  { label: "Knowledge", icon: BookOpen },
  { label: "Publish", icon: Rocket },
  { label: "Import Assets", icon: Upload },
];

export default function DashboardPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { studio } = useCurrentStudio(session);
  const { latestBuilds, failedBuilds, pendingReleases, error: widgetsError } = useReleasePipelineWidgets(session, studio?.id);

  return (
    <AppShell breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="space-y-lg p-lg">
        <section>
          <h1 className="text-2xl font-semibold">Welcome back.</h1>
          <p className="text-muted-foreground">Let&apos;s build something amazing today.</p>
        </section>

        <section className="space-y-md">
          <SectionHeader title="Quick Stats" />
          <div className="grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_STATS.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </section>

        <section className="space-y-md">
          <SectionHeader title="Quick Actions" />
          <div className="grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-5">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.label}
                {...action}
                onClick={
                  action.label === "New Project"
                    ? () => router.push("/projects")
                    : action.label === "Create Game"
                      ? () => router.push("/games")
                      : action.label === "Knowledge"
                        ? () => router.push("/knowledge")
                        : action.label === "Publish"
                          ? () => router.push("/publishing")
                          : undefined
                }
              />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="space-y-lg lg:col-span-2">
            <section className="space-y-md">
              <SectionHeader
                title="Recent Projects"
                action={
                  <Button size="sm" asChild>
                    <Link href="/projects">
                      <FolderPlus className="mr-sm size-4" aria-hidden="true" />
                      New Project
                    </Link>
                  </Button>
                }
              />
              <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
                {RECENT_PROJECTS.map((project) => (
                  <Link key={project.name} href="/projects" className="block">
                    <ProjectCard {...project} />
                  </Link>
                ))}
              </div>
            </section>

            <section className="space-y-md">
              <SectionHeader title="Recent Activity" />
              <Card>
                <CardContent className="space-y-md pt-lg">
                  {RECENT_ACTIVITY.map((entry) => (
                    <ActivityItem key={entry.title + entry.timestamp} {...entry} />
                  ))}
                </CardContent>
              </Card>
            </section>

            <section className="space-y-md">
              <SectionHeader title="Release Pipeline" />
              {widgetsError ? <p className="text-sm text-destructive">{widgetsError}</p> : null}
              <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
                <LatestBuildsWidget builds={latestBuilds} />
                <FailedBuildsWidget builds={failedBuilds} />
                <PendingReleasesWidget releases={pendingReleases} />
              </div>
            </section>
          </div>

          <div className="space-y-lg">
            <AiInsightsCard insights={AI_INSIGHTS} />
            <RoadmapSnapshotCard snapshot={ROADMAP_SNAPSHOT} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
