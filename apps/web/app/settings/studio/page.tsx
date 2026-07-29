"use client";

import { AppShell } from "../../../components/layout/app-shell";
import { StudioInfoSection } from "../../../components/settings/studio-info-section";
import { StudioMembersSection } from "../../../components/settings/studio-members-section";
import { Spinner } from "../../../components/ui/spinner";
import { useAuth } from "../../../hooks/use-auth";
import { useCurrentStudio } from "../../../hooks/use-current-studio";

export default function StudioSettingsPage() {
  const { session } = useAuth();
  const { studio, members, pendingInvites, updateStudio, revokeInvite, refresh } = useCurrentStudio(session);

  return (
    <AppShell breadcrumbs={[{ label: "Settings" }, { label: "Studio" }]}>
      <div className="mx-auto max-w-2xl space-y-lg p-lg">
        <section>
          <h1 className="text-2xl font-semibold">Studio</h1>
          <p className="text-muted-foreground">Nome, logo e membros do seu estúdio.</p>
        </section>

        {!studio ? (
          <div className="flex justify-center py-2xl">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <StudioInfoSection studio={studio} onUpdate={updateStudio} />
            <StudioMembersSection
              members={members}
              pendingInvites={pendingInvites}
              onInvited={refresh}
              onRevoke={revokeInvite}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
