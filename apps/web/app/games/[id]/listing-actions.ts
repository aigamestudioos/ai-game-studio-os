"use server";

// Sprint 2.15 — Store Listing Management. Mesmo padrão das Server Actions
// de package_name/bundle_identifier já existentes em
// `versions/[versionId]/provider-upload-actions.ts` (Sprint 2.11b/2.11c):
// usa o client autenticado com os cookies da sessão (RLS real do usuário,
// nunca service_role), valida no servidor, e devolve `{ error }` em vez de
// lançar — a UI decide como mostrar o erro.

import { cookies } from "next/headers";
import {
  createGameLocalizationsRepository,
  createGamesRepository,
  createServerClient,
  createStudioEventsRepository,
  STORE_LISTING_DEFAULT_LANGUAGE_CODE,
  type GameLocalizationsRow,
} from "@agsos/database";
import { storeListingEvent } from "../../../lib/domain-events";

async function getAuthorizedServerClient() {
  const cookieStore = await cookies();
  return createServerClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });
}

export async function saveStoreListing(
  gameId: string,
  input: { title: string; shortDescription: string; fullDescription: string; keywords: string },
): Promise<{ error?: string; listing?: GameLocalizationsRow }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const title = input.title.trim();
  if (!title) return { error: "Título da ficha de loja é obrigatório." };

  const game = await createGamesRepository(serverClient).getById(gameId);
  if (!game) return { error: "Game não encontrado ou fora do seu Studio." };

  const localizationsRepo = createGameLocalizationsRepository(serverClient);
  const existing = await localizationsRepo.getPrimaryByGame(gameId);

  try {
    const saved = await localizationsRepo.upsertPrimary({
      studio_id: game.studio_id,
      game_id: gameId,
      title,
      short_description: input.shortDescription.trim() || null,
      full_description: input.fullDescription.trim() || null,
      keywords: input.keywords.trim() || null,
    });

    await createStudioEventsRepository(serverClient).create({
      studio_id: game.studio_id,
      ...storeListingEvent(existing ? "StoreListingUpdated" : "StoreListingCreated", {
        game_id: gameId,
        language_code: STORE_LISTING_DEFAULT_LANGUAGE_CODE,
      }),
      event_version: 1,
      aggregate_type: "game_localization",
      aggregate_id: saved.id,
      metadata: { game_id: gameId },
      actor_type: "USER",
      actor_id: user.id,
    });

    return { listing: saved };
  } catch {
    return { error: "Não foi possível salvar a ficha de loja. Verifique sua permissão neste Studio." };
  }
}
