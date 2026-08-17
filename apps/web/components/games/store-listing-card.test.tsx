import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GameLocalizationsRow, GamesRow } from "@agsos/database";
import { StoreListingCard } from "./store-listing-card";

const saveStoreListing = vi.fn();
const setGamePackageName = vi.fn();
const setGameBundleIdentifier = vi.fn();

vi.mock("../../app/games/[id]/listing-actions", () => ({
  saveStoreListing: (...args: unknown[]) => saveStoreListing(...args),
}));
vi.mock("../../app/games/[id]/versions/[versionId]/provider-upload-actions", () => ({
  setGamePackageName: (...args: unknown[]) => setGamePackageName(...args),
}));
vi.mock("../../app/games/[id]/versions/[versionId]/apple-provider-upload-actions", () => ({
  setGameBundleIdentifier: (...args: unknown[]) => setGameBundleIdentifier(...args),
}));

function makeGame(overrides: Partial<GamesRow> = {}): GamesRow {
  return {
    id: "game-1",
    studio_id: "studio-1",
    project_id: "project-1",
    name: "Jogo Teste",
    description: null,
    status: "IN_DEVELOPMENT",
    package_name: null,
    bundle_identifier: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_actor_type: "USER",
    created_actor_id: "user-1",
    updated_actor_type: "USER",
    updated_actor_id: "user-1",
    ...overrides,
  } as GamesRow;
}

function makeListing(overrides: Partial<GameLocalizationsRow> = {}): GameLocalizationsRow {
  return {
    id: "loc-1",
    studio_id: "studio-1",
    game_id: "game-1",
    language_code: "en-US",
    title: "Jogo Teste",
    short_description: "resumo",
    full_description: "descrição completa",
    keywords: "jogo, teste",
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("StoreListingCard", () => {
  it("mostra empty state quando não há Store Listing ainda", () => {
    render(<StoreListingCard game={makeGame()} listing={null} listingLoading={false} listingError={null} onSaved={vi.fn()} />);
    expect(screen.getByText("Não cadastrada")).toBeInTheDocument();
    expect(screen.getByText(/Nenhuma ficha de loja ainda/i)).toBeInTheDocument();
  });

  it("mostra spinner enquanto carrega", () => {
    render(<StoreListingCard game={makeGame()} listing={undefined} listingLoading onSaved={vi.fn()} listingError={null} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("mostra erro de carregamento", () => {
    render(<StoreListingCard game={makeGame()} listing={undefined} listingLoading={false} listingError="Falha ao carregar." onSaved={vi.fn()} />);
    expect(screen.getByText("Falha ao carregar.")).toBeInTheDocument();
  });

  it("preenche o formulário com a ficha existente e permite editar/salvar", async () => {
    const onSaved = vi.fn();
    saveStoreListing.mockResolvedValueOnce({ listing: makeListing({ title: "Novo Título" }) });
    render(<StoreListingCard game={makeGame()} listing={makeListing()} listingLoading={false} listingError={null} onSaved={onSaved} />);

    expect(screen.getByText("Cadastrada")).toBeInTheDocument();
    const titleInput = screen.getByLabelText("Título") as HTMLInputElement;
    expect(titleInput.value).toBe("Jogo Teste");

    fireEvent.change(titleInput, { target: { value: "Novo Título" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar ficha de loja" }));

    await waitFor(() => expect(saveStoreListing).toHaveBeenCalledWith("game-1", expect.objectContaining({ title: "Novo Título" })));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("salva Package Name e Bundle Identifier reutilizando as Server Actions existentes do Provider Upload", async () => {
    const onSaved = vi.fn();
    setGamePackageName.mockResolvedValueOnce({});
    setGameBundleIdentifier.mockResolvedValueOnce({});
    render(<StoreListingCard game={makeGame()} listing={null} listingLoading={false} listingError={null} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText("Package Name (Google Play)"), { target: { value: "com.exemplo.jogo" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Salvar" })[0]!);
    await waitFor(() => expect(setGamePackageName).toHaveBeenCalledWith("game-1", "com.exemplo.jogo"));

    fireEvent.change(screen.getByLabelText("Bundle Identifier (App Store)"), { target: { value: "com.exemplo.jogo" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Salvar" })[1]!);
    await waitFor(() => expect(setGameBundleIdentifier).toHaveBeenCalledWith("game-1", "com.exemplo.jogo"));
  });
});
