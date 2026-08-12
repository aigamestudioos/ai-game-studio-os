"use client";

import { useEffect, useState } from "react";
import {
  createGamesRepository,
  createPlatformsRepository,
  createStoreConnectionsRepository,
  createUsersRepository,
  type BuildArtifactsRow,
  type Session,
  type StoreConnectionsRow,
} from "@agsos/database";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { getBrowserClient } from "../../lib/supabase-client";
import { useProviderUploads } from "../../hooks/use-provider-uploads";
import { appleUploadStateLabel, providerUploadErrorLabel, providerUploadStatusLabel } from "../../lib/provider-upload-status";
import { toast } from "../../hooks/use-toast";
import {
  retryAppleProviderUpload,
  sendArtifactToAppStore,
  setGameBundleIdentifier,
} from "../../app/games/[id]/versions/[versionId]/apple-provider-upload-actions";

// Sprint 2.11c — seção pequena, só para Artifacts IPA já STORED+VALID.
// Mesmo padrão de `GooglePlaySendSection` (Sprint 2.11b), mas NÃO
// compartilhada como componente único — os dois protocolos (Edit do
// Google vs BuildUpload multi-arquivo/multi-chunk da Apple) são
// materialmente diferentes o suficiente para não justificar uma
// mega-abstração provider-agnostic na UI (decisão do sprint). O que é
// genuinamente compartilhável (badges de status, hook de listagem,
// labels de erro) já vive em `lib/provider-upload-status.ts` e
// `hooks/use-provider-uploads.ts`.
export function AppleSendSection({
  session,
  gameId,
  artifact,
}: {
  session: Session | null | undefined;
  gameId: string;
  artifact: BuildArtifactsRow;
}) {
  const eligible = artifact.file_extension === "ipa" && artifact.upload_status === "STORED" && artifact.validation_status === "VALID";
  const { uploads, loading: uploadsLoading, reload } = useProviderUploads(session, eligible ? artifact.id : undefined);

  const [connections, setConnections] = useState<StoreConnectionsRow[] | undefined>(undefined);
  const [bundleIdentifier, setBundleIdentifier] = useState<string | null | undefined>(undefined);
  const [bundleIdentifierInput, setBundleIdentifierInput] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [savingBundleIdentifier, setSavingBundleIdentifier] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !eligible) return;
    const client = getBrowserClient();
    createUsersRepository(client)
      .getById(session.user.id)
      .then(async (profile) => {
        if (!profile) return;
        const [storeConnections, platforms, game] = await Promise.all([
          createStoreConnectionsRepository(client).listByStudio(profile.studio_id).catch(() => []),
          createPlatformsRepository(client).list().catch(() => []),
          createGamesRepository(client).getById(gameId).catch(() => null),
        ]);
        const applePlatform = platforms.find((p) => p.name === "App Store");
        const appleConnections = applePlatform ? storeConnections.filter((c) => c.platform_id === applePlatform.id) : [];
        setConnections(appleConnections);
        if (appleConnections.length === 1) setSelectedConnectionId(appleConnections[0]!.id);
        setBundleIdentifier(game?.bundle_identifier ?? null);
      });
  }, [session, eligible, gameId]);

  if (!eligible) return null;

  async function handleSaveBundleIdentifier() {
    setSavingBundleIdentifier(true);
    try {
      const result = await setGameBundleIdentifier(gameId, bundleIdentifierInput);
      if (result.error) {
        toast({ title: "Não foi possível salvar", description: result.error, variant: "destructive" });
        return;
      }
      setBundleIdentifier(bundleIdentifierInput.trim());
      toast({ title: "Bundle Identifier salvo", variant: "success" });
    } finally {
      setSavingBundleIdentifier(false);
    }
  }

  // Sprint 2.11d-2b — Server Action só enfileira agora; ver comentário
  // equivalente em `google-play-send-section.tsx`.
  async function handleSend() {
    if (!selectedConnectionId || sending) return;
    setSending(true);
    try {
      const result = await sendArtifactToAppStore(artifact.id, selectedConnectionId);
      if (result.error) {
        toast({ title: "Envio falhou", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Envio na fila", description: "Acompanhe o estado abaixo.", variant: "success" });
      }
      reload();
    } finally {
      setSending(false);
    }
  }

  async function handleRetry(providerUploadId: string) {
    if (retryingId) return;
    setRetryingId(providerUploadId);
    try {
      const result = await retryAppleProviderUpload(providerUploadId);
      if (result.error) {
        toast({ title: "Retry falhou", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Retry na fila", description: "Acompanhe o estado abaixo.", variant: "success" });
      }
      reload();
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-sm rounded-sm border border-dashed border-border p-sm">
      <span className="text-xs font-medium">App Store</span>

      {bundleIdentifier === undefined || connections === undefined ? (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      ) : connections.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma Store Connection da App Store conectada neste Studio.</p>
      ) : !bundleIdentifier ? (
        <div className="flex items-center gap-sm">
          <Input
            placeholder="com.exemplo.jogo"
            value={bundleIdentifierInput}
            onChange={(e) => setBundleIdentifierInput(e.target.value)}
            className="h-8 text-xs"
          />
          <Button size="sm" variant="outline" loading={savingBundleIdentifier} disabled={savingBundleIdentifier || !bundleIdentifierInput} onClick={handleSaveBundleIdentifier}>
            Salvar Bundle Identifier
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-sm">
          {connections.length > 1 ? (
            <select
              className="h-8 rounded-sm border border-border bg-transparent text-xs"
              value={selectedConnectionId ?? ""}
              onChange={(e) => setSelectedConnectionId(e.target.value || null)}
            >
              <option value="">Selecione a conexão…</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name ?? c.id.slice(0, 8)}
                </option>
              ))}
            </select>
          ) : null}
          <Button size="sm" loading={sending} disabled={sending || !selectedConnectionId} onClick={handleSend}>
            Enviar à App Store
          </Button>
        </div>
      )}

      {uploadsLoading ? null : uploads.length > 0 ? (
        <div className="space-y-1">
          {uploads.map((upload) => {
            const errorLabel = providerUploadErrorLabel(upload.error_code);
            const stateLabel = appleUploadStateLabel(upload.apple_upload_state);
            return (
              <div key={upload.id} className="flex flex-wrap items-center gap-sm text-xs">
                <Badge variant={upload.status === "SUCCEEDED" ? "success" : upload.status === "FAILED" ? "destructive" : "outline"}>
                  {providerUploadStatusLabel(upload.status, "APPLE_APP_STORE")}
                </Badge>
                {stateLabel ? <span className="text-text-tertiary">estado Apple: {stateLabel}</span> : null}
                <span className="text-text-tertiary">tentativa {upload.attempt}</span>
                {errorLabel ? <span className="text-destructive">{errorLabel}</span> : null}
                {upload.status === "FAILED" ? (
                  <Button size="sm" variant="ghost" loading={retryingId === upload.id} disabled={retryingId !== null} onClick={() => handleRetry(upload.id)}>
                    Retry
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
