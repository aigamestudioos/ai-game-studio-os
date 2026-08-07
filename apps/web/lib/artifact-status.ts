import type { ArtifactUploadStatus, ArtifactValidationStatus } from "@agsos/database";

// Textos da UI de Artifact (Sprint 2.11a) — deliberadamente nunca mencionam
// Apple/Google/publicação (fora de escopo deste sprint, decisão do
// usuário). Distinguem sempre "chegou ao AGSOS" (upload_status) de
// "estrutura interna é coerente" (validation_status) — nunca uma frase só
// que misture os dois conceitos.
export function uploadStatusLabel(status: ArtifactUploadStatus): string {
  switch (status) {
    case "PENDING":
      return "Aguardando upload";
    case "UPLOADING":
      return "Enviando para o AGSOS";
    case "STORED":
      return "Armazenado no AGSOS";
    case "FAILED":
      return "Upload falhou";
    case "CANCELED":
      return "Upload cancelado";
  }
}

export function validationStatusLabel(status: ArtifactValidationStatus): string {
  switch (status) {
    case "PENDING":
      return "Validação pendente";
    case "VALIDATING":
      return "Validando artefato";
    case "VALID":
      return "Artefato válido (estrutural)";
    case "INVALID":
      return "Artefato inválido";
    case "FAILED":
      return "Falha ao validar";
  }
}

const VALIDATION_ERROR_LABEL: Record<string, string> = {
  EXTENSION_NOT_ALLOWED: "Extensão não suportada (só .aab/.ipa).",
  SIZE_LIMIT_EXCEEDED: "Arquivo acima do limite de 500MB.",
  ZIP_STRUCTURE_INVALID: "Estrutura ZIP inválida ou corrompida.",
  AAB_STRUCTURE_INVALID: "Estrutura interna de Android App Bundle não reconhecida.",
  IPA_STRUCTURE_INVALID: "Estrutura interna de IPA (Payload/*.app) não encontrada.",
};

// Nunca devolve o código bruto sem tradução caso ele exista no dicionário —
// sanitizado (nunca stack trace/mensagem interna), conforme decisão do
// sprint ("erro sanitizado" na UI).
export function validationErrorLabel(code: string | null): string | null {
  if (!code) return null;
  return VALIDATION_ERROR_LABEL[code] ?? "Falha estrutural não identificada.";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex++;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
