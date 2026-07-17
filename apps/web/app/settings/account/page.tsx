"use client";

import { AppShell } from "../../../components/layout/app-shell";
import { DangerZoneSection } from "../../../components/settings/danger-zone-section";
import { PreferencesSection } from "../../../components/settings/preferences-section";
import { ProfileSection } from "../../../components/settings/profile-section";
import { SecuritySection } from "../../../components/settings/security-section";
import { Spinner } from "../../../components/ui/spinner";
import { useAuth } from "../../../hooks/use-auth";

export default function AccountSettingsPage() {
  const { session } = useAuth();

  return (
    <AppShell breadcrumbs={[{ label: "Settings" }, { label: "Account" }]}>
      <div className="mx-auto max-w-2xl space-y-lg p-lg">
        <section>
          <h1 className="text-2xl font-semibold">Configurações da conta</h1>
          <p className="text-muted-foreground">Perfil, preferências e segurança da sua conta.</p>
        </section>

        {!session ? (
          <div className="flex justify-center py-2xl">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <ProfileSection session={session} />
            <PreferencesSection />
            <SecuritySection />
            <DangerZoneSection />
          </>
        )}
      </div>
    </AppShell>
  );
}
