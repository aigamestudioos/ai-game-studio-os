// Validação ESTRUTURAL de artefatos (Sprint 2.11a) — nunca "assinatura
// validada" (fora de escopo deste sprint, decisão explícita). Confirma:
// (1) extensão permitida, (2) tamanho dentro do limite do bucket `builds`,
// (3) o arquivo é um ZIP sintaticamente válido (End of Central Directory +
// Central Directory legíveis), (4) contém a estrutura interna mínima
// esperada para o tipo declarado. Não usa nenhuma lib de ZIP externa — o
// parsing de Central Directory é pequeno o bastante (formato bem
// documentado, ZIP64 fora de escopo: AAB/IPA de até 500MiB nunca precisam
// dele) para não justificar uma dependência nova.

export const ARTIFACT_MAX_SIZE_BYTES = 524_288_000; // 500MiB — mesmo limite do bucket `builds`.
export const ALLOWED_ARTIFACT_EXTENSIONS = ["aab", "ipa"] as const;
export type AllowedArtifactExtension = (typeof ALLOWED_ARTIFACT_EXTENSIONS)[number];

export type ArtifactValidationErrorCode =
  | "EXTENSION_NOT_ALLOWED"
  | "SIZE_LIMIT_EXCEEDED"
  | "ZIP_STRUCTURE_INVALID"
  | "AAB_STRUCTURE_INVALID"
  | "IPA_STRUCTURE_INVALID";

export type ArtifactValidationResult = { valid: true } | { valid: false; errorCode: ArtifactValidationErrorCode };

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const MAX_EOCD_COMMENT_SIZE = 65_535;
const EOCD_FIXED_SIZE = 22;

// Lê os nomes de entrada de um ZIP a partir do Central Directory — nunca
// descompacta conteúdo, só a estrutura (nomes de arquivo/pasta), que é o
// suficiente para validar "estrutura mínima compatível" sem custo de
// descompactar um binário de até 500MiB inteiro na memória do servidor.
function listZipEntries(buffer: Buffer): string[] | null {
  const searchStart = Math.max(0, buffer.length - MAX_EOCD_COMMENT_SIZE - EOCD_FIXED_SIZE);
  let eocdOffset = -1;
  for (let i = buffer.length - EOCD_FIXED_SIZE; i >= searchStart; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) return null;

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (centralDirOffset >= buffer.length) return null;

  const entries: string[] = [];
  let offset = centralDirOffset;
  for (let i = 0; i < entryCount; i++) {
    if (offset + 46 > buffer.length) return null;
    if (buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) return null;

    const filenameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const filenameStart = offset + 46;
    const filenameEnd = filenameStart + filenameLength;
    if (filenameEnd > buffer.length) return null;

    entries.push(buffer.toString("utf-8", filenameStart, filenameEnd));
    offset = filenameEnd + extraLength + commentLength;
  }
  return entries;
}

function validateAabEntries(entries: string[]): boolean {
  // Android App Bundle: estrutura mínima real sempre inclui o descritor do
  // bundle na raiz e o manifest do módulo `base` — mesmos arquivos citados
  // na especificação pública do formato .aab (bundletool).
  const hasBundleConfig = entries.includes("BundleConfig.pb");
  const hasBaseManifest = entries.some((e) => e === "base/manifest/AndroidManifest.xml");
  return hasBundleConfig && hasBaseManifest;
}

function validateIpaEntries(entries: string[]): boolean {
  // IPA: sempre um `Payload/<Nome>.app/` na raiz (estrutura padrão de app
  // bundle iOS empacotado para distribuição).
  return entries.some((e) => /^Payload\/[^/]+\.app\//.test(e));
}

export function validateArtifactStructure(params: {
  fileExtension: string;
  sizeBytes: number;
  buffer: Buffer;
}): ArtifactValidationResult {
  const extension = params.fileExtension.toLowerCase().replace(/^\./, "");
  if (!ALLOWED_ARTIFACT_EXTENSIONS.includes(extension as AllowedArtifactExtension)) {
    return { valid: false, errorCode: "EXTENSION_NOT_ALLOWED" };
  }
  if (params.sizeBytes <= 0 || params.sizeBytes > ARTIFACT_MAX_SIZE_BYTES) {
    return { valid: false, errorCode: "SIZE_LIMIT_EXCEEDED" };
  }

  const entries = listZipEntries(params.buffer);
  if (entries === null) {
    return { valid: false, errorCode: "ZIP_STRUCTURE_INVALID" };
  }

  if (extension === "aab") {
    return validateAabEntries(entries) ? { valid: true } : { valid: false, errorCode: "AAB_STRUCTURE_INVALID" };
  }
  return validateIpaEntries(entries) ? { valid: true } : { valid: false, errorCode: "IPA_STRUCTURE_INVALID" };
}
