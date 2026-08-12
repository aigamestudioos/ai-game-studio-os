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
import { providerUploadErrorLabel, providerUploadStatusLabel } from "../../lib/provider-upload-status";
import { toast } from "../../hooks/use-toast";
import { retryProviderUpload, sendArtifactToGooglePlay, setGamePackageName } from "../../app/games/[id]/versions/[versionId]/provider-upload-actions";

// Sprint 2.11b — seção pequena, só para Artifacts AAB já STORED+VALID.
// Nunca menciona "Publicado"/"release" — este sprint termina no upload
// bem-sucedido a um Google Play Edit rascunho (DECISIONS.md).
export function GooglePlaySendSection({
  session,
  gameId,
  artifact,
}: {
  session: Session | null | undefined;
  gameId: string;
  artifact: BuildArtifactsRow;
}) {
  const eligible = artifact.file_extension === "aab" && artifact.upload_status === "STORED" && artifact.validation_status === "VALID";
  const { uploads, loading: uploadsLoading, reload } = useProviderUploads(session, eligible ? artifact.id : undefined);

  const [connections, setConnections] = useState<StoreConnectionsRow[] | undefined>(undefined);
  const [packageName, setPackageName] = useState<string | null | undefined>(undefined);
  const [packageNameInput, setPackageNameInput] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [savingPackageName, setSavingPackageName] = useState(false);
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
        const googlePlatform = platforms.find((p) => p.name === "Google Play");
        const googleConnections = googlePlatform ? storeConnections.filter((c) => c.platform_id === googlePlatform.id) : [];
        setConnections(googleConnections);
        if (googleConnections.length === 1) setSelectedConnectionId(googleConnections[0]!.id);
        setPackageName(game?.package_name ?? null);
      });
  }, [session, eligible, gameId]);

  if (!eligible) return null;

  async function handleSavePackageName() {
    setSavingPackageName(true);
    try {
      const result = await setGamePackageName(gameId, packageNameInput);
      if (result.error) {
        toast({ title: "Não foi possível salvar", description: result.error, variant: "destructive" });
        return;
      }
      setPackageName(packageNameInput.trim());
      toast({ title: "Package name salvo", variant: "success" });
    } finally {
      setSavingPackageName(false);
    }
  }

  // Sprint 2.11d-2b — a Server Action só enfileira; a resposta nunca traz
  // `versionCode` (isso só existe depois que o worker de verdade
  // transferir, ver `provider-upload-actions.ts`). O `disabled` do botão
  // (via `sending`) já bloqueia clique duplo na UI — mas é só
  // complementar: a guarda real está no banco (`enqueue_provider_upload_job`,
  // GATE 12), que rejeita um segundo enqueue concorrente mesmo que a UI
  // falhe em desabilitar o botão a tempo (ex.: dois cliques na janela
  // entre o clique e o React re-renderizar).
  async function handleSend() {
    if (!selectedConnectionId || sending) return;
    setSending(true);
    try {
      const result = await sendArtifactToGooglePlay(artifact.id, selectedConnectionId);
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
      const result = await retryProviderUpload(providerUploadId);
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
      <span className="text-xs font-medium">Google Play</span>

      {packageName === undefined || connections === undefined ? (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      ) : connections.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma Store Connection do Google Play conectada neste Studio.</p>
      ) : !packageName ? (
        <div className="flex items-center gap-sm">
          <Input
            placeholder="com.exemplo.jogo"
            value={packageNameInput}
            onChange={(e) => setPackageNameInput(e.target.value)}
            className="h-8 text-xs"
          />
          <Button size="sm" variant="outline" loading={savingPackageName} disabled={savingPackageName || !packageNameInput} onClick={handleSavePackageName}>
            Salvar Package Name
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
            Enviar ao Google Play
          </Button>
        </div>
      )}

      {uploadsLoading ? null : uploads.length > 0 ? (
        <div className="space-y-1">
          {uploads.map((upload) => {
            const errorLabel = providerUploadErrorLabel(upload.error_code);
            return (
              <div key={upload.id} className="flex flex-wrap items-center gap-sm text-xs">
                <Badge variant={upload.status === "SUCCEEDED" ? "success" : upload.status === "FAILED" ? "destructive" : "outline"}>
                  {providerUploadStatusLabel(upload.status, "GOOGLE_PLAY")}
                </Badge>
                {upload.version_code ? <span className="text-text-tertiary">versionCode {upload.version_code}</span> : null}
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
