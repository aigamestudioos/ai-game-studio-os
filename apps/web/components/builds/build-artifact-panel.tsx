"use client";

import { buildResumableUploadConfig } from "@agsos/storage";
import { useRef, useState, type ChangeEvent } from "react";
import * as tus from "tus-js-client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { getBrowserClient } from "../../lib/supabase-client";
import { ALLOWED_ARTIFACT_EXTENSIONS, ARTIFACT_MAX_SIZE_BYTES } from "../../lib/artifact-validation";
import { formatBytes, uploadStatusLabel, validationErrorLabel, validationStatusLabel } from "../../lib/artifact-status";
import { useBuildArtifacts } from "../../hooks/use-build-artifacts";
import { toast } from "../../hooks/use-toast";
import {
  archiveArtifact,
  confirmArtifactStored,
  createPendingArtifact,
  getArtifactDownloadUrl,
  markArtifactUploadFailed,
} from "../../app/games/[id]/versions/[versionId]/artifact-actions";
import type { Session } from "@agsos/database";

const CHUNK_SIZE = 6 * 1024 * 1024; // múltiplo exigido pelo endpoint resumível do Supabase Storage.

function fileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1]!.toLowerCase() : "";
}

async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type UploadState = { artifactId: string; progress: number; upload: tus.Upload } | null;

export function BuildArtifactPanel({ session, buildId }: { session: Session | null | undefined; buildId: string }) {
  const { artifacts, loading, reload } = useBuildArtifacts(session, buildId);
  const [uploadState, setUploadState] = useState<UploadState>(null);
  const [preparing, setPreparing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const extension = fileExtension(file.name);
    if (!ALLOWED_ARTIFACT_EXTENSIONS.includes(extension as never)) {
      toast({ title: "Extensão não suportada", description: "Só .aab ou .ipa.", variant: "destructive" });
      return;
    }
    if (file.size > ARTIFACT_MAX_SIZE_BYTES) {
      toast({ title: "Arquivo acima do limite", description: "Limite de 500MB por artefato.", variant: "destructive" });
      return;
    }

    setPreparing(true);
    try {
      const checksum = await computeSha256(file);
      const client = getBrowserClient();
      const {
        data: { session: activeSession },
      } = await client.auth.getSession();
      if (!activeSession) {
        toast({ title: "Sessão expirada", variant: "destructive" });
        return;
      }

      const created = await createPendingArtifact({
        buildId,
        originalFilename: file.name,
        fileExtension: extension,
        sizeBytes: file.size,
        checksum,
        mimeTypeReported: file.type || null,
      });
      if (created.error || !created.artifactId || !created.storageBucket || !created.storagePath) {
        toast({ title: "Não foi possível iniciar o upload", description: created.error, variant: "destructive" });
        return;
      }

      const resumable = buildResumableUploadConfig({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        accessToken: activeSession.access_token,
        bucket: created.storageBucket,
        path: created.storagePath,
        contentType: file.type || "application/octet-stream",
      });

      const upload = new tus.Upload(file, {
        endpoint: resumable.endpoint,
        headers: resumable.headers,
        chunkSize: CHUNK_SIZE,
        metadata: resumable.metadata as Record<string, string>,
        removeFingerprintOnSuccess: true,
        onError: async (err) => {
          await markArtifactUploadFailed(created.artifactId!, err.message ?? "Erro desconhecido");
          setUploadState(null);
          toast({ title: "Upload falhou", description: "Tente novamente.", variant: "destructive" });
          reload();
        },
        onProgress: (sent, total) => {
          setUploadState((prev) => (prev ? { ...prev, progress: Math.round((sent / total) * 100) } : prev));
        },
        onSuccess: async () => {
          setUploadState(null);
          const confirmed = await confirmArtifactStored(created.artifactId!);
          if (confirmed.error) {
            toast({ title: "Upload concluído, mas a confirmação falhou", description: confirmed.error, variant: "destructive" });
          } else if (confirmed.validationStatus === "VALID") {
            toast({ title: "Artefato armazenado e válido", variant: "success" });
          } else {
            toast({ title: "Artefato armazenado, mas inválido", description: validationErrorLabel(confirmed.validationErrorCode ?? null) ?? undefined, variant: "warning" });
          }
          reload();
        },
      });

      setUploadState({ artifactId: created.artifactId, progress: 0, upload });
      upload.start();
    } finally {
      setPreparing(false);
    }
  }

  function handleCancel() {
    if (!uploadState) return;
    uploadState.upload.abort(true);
    markArtifactUploadFailed(uploadState.artifactId, "Cancelado pelo usuário").then(reload);
    setUploadState(null);
  }

  async function handleDownload(artifactId: string) {
    const result = await getArtifactDownloadUrl(artifactId);
    if (result.error || !result.url) {
      toast({ title: "Não foi possível gerar o download", description: result.error, variant: "destructive" });
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  async function handleRemove(artifactId: string) {
    const result = await archiveArtifact(artifactId);
    if (result.error) {
      toast({ title: "Não foi possível remover", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Artefato removido", variant: "success" });
    reload();
  }

  return (
    <div className="space-y-sm rounded-sm border border-border p-sm">
      <div className="flex items-center justify-between gap-sm">
        <span className="text-sm font-medium">Artefatos (AAB/IPA)</span>
        <div>
          <input ref={inputRef} type="file" accept=".aab,.ipa" className="hidden" onChange={handleFileSelected} />
          <Button size="sm" variant="outline" loading={preparing} disabled={preparing || uploadState !== null} onClick={() => inputRef.current?.click()}>
            Selecionar arquivo
          </Button>
        </div>
      </div>

      {uploadState ? (
        <div className="space-y-1">
          <Progress value={uploadState.progress} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Enviando para o AGSOS — {uploadState.progress}%</span>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando artefatos…</p>
      ) : artifacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum artefato enviado ainda.</p>
      ) : (
        <div className="space-y-sm">
          {artifacts.map((artifact) => {
            const errorLabel = validationErrorLabel(artifact.validation_error_code);
            return (
              <div key={artifact.id} className="space-y-1 rounded-sm border border-border p-sm text-sm">
                <div className="flex items-center gap-sm">
                  <span className="font-medium">{artifact.original_filename}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(artifact.size_bytes)}</span>
                  <span className="text-xs text-muted-foreground">.{artifact.file_extension}</span>
                </div>
                <div className="flex flex-wrap items-center gap-sm">
                  <Badge variant={artifact.upload_status === "STORED" ? "success" : artifact.upload_status === "FAILED" ? "destructive" : "outline"}>
                    {uploadStatusLabel(artifact.upload_status)}
                  </Badge>
                  <Badge variant={artifact.validation_status === "VALID" ? "success" : artifact.validation_status === "INVALID" || artifact.validation_status === "FAILED" ? "destructive" : "outline"}>
                    {validationStatusLabel(artifact.validation_status)}
                  </Badge>
                  <span className="text-xs text-text-tertiary">SHA-256: {artifact.checksum.slice(0, 16)}…</span>
                </div>
                {errorLabel ? <p className="text-xs text-destructive">{errorLabel}</p> : null}
                <div className="flex gap-sm">
                  {artifact.upload_status === "STORED" ? (
                    <Button size="sm" variant="outline" onClick={() => handleDownload(artifact.id)}>
                      Download
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => handleRemove(artifact.id)}>
                    Remover
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
