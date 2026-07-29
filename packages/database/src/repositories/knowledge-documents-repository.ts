import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, KnowledgeDocumentsRow, KnowledgeDocumentVersionsRow } from "../generated/database.types";

// Repository do Aggregate Root SpecificationDocument/KnowledgeDocument
// (AGSOS-SPEC-002 §12, §17). Versões são imutáveis — só createVersion, sem
// updateVersion (AGSOS-SPEC-003 §9: "documentos publicados não são
// sobrescritos — uma alteração cria nova versão").
export function createKnowledgeDocumentsRepository(client: SupabaseClient<Database>) {
  return {
    async list(): Promise<KnowledgeDocumentsRow[]> {
      const { data, error } = await client
        .from("knowledge_documents")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async getById(id: string): Promise<KnowledgeDocumentsRow | null> {
      const { data, error } = await client.from("knowledge_documents").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(
      input: Pick<KnowledgeDocumentsRow, "studio_id" | "title" | "type"> & Partial<KnowledgeDocumentsRow>,
    ): Promise<KnowledgeDocumentsRow> {
      const { data, error } = await client.from("knowledge_documents").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },

    async createVersion(
      input: Pick<
        KnowledgeDocumentVersionsRow,
        "studio_id" | "document_id" | "version_number" | "content" | "created_actor_type" | "created_actor_id"
      > &
        Partial<KnowledgeDocumentVersionsRow>,
    ): Promise<KnowledgeDocumentVersionsRow> {
      const { data, error } = await client.from("knowledge_document_versions").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },

    // `summary`/`content` vivem na versão (imutável), não no documento — um
    // documento sem nenhuma versão ainda não tem resumo para mostrar. Busca
    // em uma consulta separada (não join aninhado do PostgREST), mesmo
    // padrão de builds-repository.listByGame() (Sprint 2.1).
    async listWithLatestSummary(): Promise<{ document: KnowledgeDocumentsRow; summary: string | null }[]> {
      const { data: documents, error: documentsError } = await client
        .from("knowledge_documents")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (documentsError) throw documentsError;
      if (!documents || documents.length === 0) return [];

      const { data: versions, error } = await client
        .from("knowledge_document_versions")
        .select("document_id, summary, version_number")
        .in(
          "document_id",
          documents.map((d) => d.id),
        );
      if (error) throw error;

      const latestByDocument = new Map<string, { summary: string | null; version_number: number }>();
      for (const version of versions ?? []) {
        const current = latestByDocument.get(version.document_id);
        if (!current || version.version_number > current.version_number) {
          latestByDocument.set(version.document_id, version);
        }
      }

      return documents.map((document) => ({
        document,
        summary: latestByDocument.get(document.id)?.summary ?? null,
      }));
    },

    async getLatestVersion(documentId: string): Promise<KnowledgeDocumentVersionsRow | null> {
      const { data, error } = await client
        .from("knowledge_document_versions")
        .select("*")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  };
}
