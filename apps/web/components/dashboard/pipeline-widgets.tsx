import Link from "next/link";
import type { BuildWithGameDetails, ReleaseWithGameDetails } from "@agsos/database";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { buildStatusLabel } from "../../lib/build-status";
import { releaseChannelLabel, releaseStatusLabel, releaseStatusVariant } from "../../lib/release-status";

// Sprint 2.6 — primeiros widgets reais do Dashboard, ligados ao Release
// Pipeline (Sprint 2.4/2.5). Os demais widgets do Dashboard continuam mock
// (`mock-data.ts`) — fora de escopo deste sprint, ver DECISIONS.md.

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}

export function LatestBuildsWidget({ builds }: { builds: BuildWithGameDetails[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Latest Builds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-sm">
        {builds === undefined ? (
          <EmptyState message="Carregando..." />
        ) : builds.length === 0 ? (
          <EmptyState message="Nenhuma build ainda." />
        ) : (
          builds.map((build) => (
            <div key={build.id} className="flex items-center gap-sm text-sm">
              <span className="font-medium">{build.gameName}</span>
              <span className="text-muted-foreground">v{build.versionNumber} — {build.platformName}</span>
              <Badge variant="outline" className="ml-auto shrink-0">
                {buildStatusLabel(build.status)}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function FailedBuildsWidget({ builds }: { builds: BuildWithGameDetails[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Failed Builds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-sm">
        {builds === undefined ? (
          <EmptyState message="Carregando..." />
        ) : builds.length === 0 ? (
          <EmptyState message="Nenhuma build falhou recentemente." />
        ) : (
          builds.map((build) => (
            <Link
              key={build.id}
              href={`/games/${build.gameId}`}
              className="flex items-center gap-sm rounded-sm p-sm text-sm hover:bg-muted"
            >
              <span className="font-medium">{build.gameName}</span>
              <span className="text-muted-foreground">v{build.versionNumber} — {build.platformName}</span>
              <Badge variant="destructive" className="ml-auto shrink-0">
                {buildStatusLabel(build.status)}
              </Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function PendingReleasesWidget({ releases }: { releases: ReleaseWithGameDetails[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pending Releases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-sm">
        {releases === undefined ? (
          <EmptyState message="Carregando..." />
        ) : releases.length === 0 ? (
          <EmptyState message="Nenhum release pendente." />
        ) : (
          releases.map((release) => (
            <div key={release.id} className="flex items-center gap-sm text-sm">
              <span className="font-medium">{release.gameName}</span>
              <span className="text-muted-foreground">v{release.versionNumber} — {releaseChannelLabel(release.releaseChannel)}</span>
              <Badge variant={releaseStatusVariant(release.status)} className="ml-auto shrink-0">
                {releaseStatusLabel(release.status)}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
