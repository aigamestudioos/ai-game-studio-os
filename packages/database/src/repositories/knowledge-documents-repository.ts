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
      input: Pick<KnowledgeDocumentVersionsRow, "studio_id" | "document_id" | "version_number" | "content">,
    ): Promise<KnowledgeDocumentVersionsRow> {
      const { data, error } = await client.from("knowledge_document_versions").insert(input).select("*").single();
      if (error) throw error;
      return data;
    },
  };
}
