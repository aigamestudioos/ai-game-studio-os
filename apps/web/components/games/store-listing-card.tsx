"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { GameLocalizationsRow, GamesRow } from "@agsos/database";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";
import { Textarea } from "../ui/textarea";
import { toast } from "../../hooks/use-toast";
import { saveStoreListing } from "../../app/games/[id]/listing-actions";
import { setGamePackageName } from "../../app/games/[id]/versions/[versionId]/provider-upload-actions";
import { setGameBundleIdentifier } from "../../app/games/[id]/versions/[versionId]/apple-provider-upload-actions";

// Sprint 2.15 — Store Listing Management. Superfície única em Game →
// Store Listing (id="store-listing", usado pelo deep link "Corrigir" do
// Readiness Panel) para resolver `METADATA_LISTING_MISSING` /
// `METADATA_PACKAGE_NAME_MISSING` / `METADATA_BUNDLE_IDENTIFIER_MISSING`
// pela UI — nenhum dos três tinha caminho de produto antes desta sprint
// (listing) ou tinha só um caminho indireto dentro do painel de upload de
// Build (identificadores, Sprint 2.11b/2.11c).
export function StoreListingCard({
  game,
  listing,
  listingLoading,
  listingError,
  onSaved,
}: {
  game: GamesRow;
  listing: GameLocalizationsRow | null | undefined;
  listingLoading: boolean;
  listingError: string | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [packageName, setPackageNameInput] = useState(game.package_name ?? "");
  const [bundleIdentifier, setBundleIdentifierInput] = useState(game.bundle_identifier ?? "");

  const [savingListing, setSavingListing] = useState(false);
  const [savingPackageName, setSavingPackageName] = useState(false);
  const [savingBundleIdentifier, setSavingBundleIdentifier] = useState(false);

  // Preenche o formulário quando a ficha carrega (empty state se `null`).
  useEffect(() => {
    if (!listing) return;
    setTitle(listing.title);
    setShortDescription(listing.short_description ?? "");
    setFullDescription(listing.full_description ?? "");
    setKeywords(listing.keywords ?? "");
  }, [listing]);

  async function handleSaveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setSavingListing(true);
    try {
      const result = await saveStoreListing(game.id, { title, shortDescription, fullDescription, keywords });
      if (result.error) {
        toast({ title: "Não foi possível salvar a ficha de loja", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Ficha de loja salva", variant: "success" });
      onSaved();
    } finally {
      setSavingListing(false);
    }
  }

  async function handleSavePackageName() {
    setSavingPackageName(true);
    try {
      const result = await setGamePackageName(game.id, packageName);
      if (result.error) {
        toast({ title: "Não foi possível salvar", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Package Name salvo", variant: "success" });
      onSaved();
    } finally {
      setSavingPackageName(false);
    }
  }

  async function handleSaveBundleIdentifier() {
    setSavingBundleIdentifier(true);
    try {
      const result = await setGameBundleIdentifier(game.id, bundleIdentifier);
      if (result.error) {
        toast({ title: "Não foi possível salvar", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Bundle Identifier salvo", variant: "success" });
      onSaved();
    } finally {
      setSavingBundleIdentifier(false);
    }
  }

  return (
    <Card id="store-listing">
      <CardHeader>
        <div className="flex items-center justify-between gap-sm">
          <CardTitle className="text-base">Store Listing</CardTitle>
          {listing ? <Badge variant="success">Cadastrada</Badge> : listing === null ? <Badge variant="outline">Não cadastrada</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-lg">
        {listingError ? <p className="text-sm text-destructive">{listingError}</p> : null}

        {listingLoading && listing === undefined ? (
          <div className="flex justify-center py-lg">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSaveListing} className="space-y-md">
            {listing === null ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma ficha de loja ainda — preencha abaixo para satisfazer o Release Readiness (idioma padrão: en-US).
              </p>
            ) : null}
            <div className="space-y-sm">
              <label htmlFor="listing-title" className="text-sm font-medium">
                Título
              </label>
              <Input
                id="listing-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do jogo na loja"
                required
                disabled={savingListing}
              />
            </div>
            <div className="space-y-sm">
              <label htmlFor="listing-short" className="text-sm font-medium">
                Descrição curta
              </label>
              <Input
                id="listing-short"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Resumo de uma linha"
                disabled={savingListing}
              />
            </div>
            <div className="space-y-sm">
              <label htmlFor="listing-full" className="text-sm font-medium">
                Descrição completa
              </label>
              <Textarea
                id="listing-full"
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Descrição completa exibida na ficha da loja"
                rows={5}
                disabled={savingListing}
              />
            </div>
            <div className="space-y-sm">
              <label htmlFor="listing-keywords" className="text-sm font-medium">
                Palavras-chave
              </label>
              <Input
                id="listing-keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="separadas, por, vírgula"
                disabled={savingListing}
              />
            </div>
            <Button type="submit" loading={savingListing} disabled={savingListing || !title.trim()}>
              Salvar ficha de loja
            </Button>
          </form>
        )}

        {/* Coluna única (não `sm:grid-cols-2`): este card vive na coluna
            lateral estreita de `/games/[id]`, não numa área de largura
            total — duas colunas aqui truncava o placeholder do Input. */}
        <div className="space-y-md border-t border-border pt-md">
          <div className="space-y-sm">
            <label htmlFor="game-package-name" className="text-sm font-medium">
              Package Name (Google Play)
            </label>
            <div className="flex gap-sm">
              <Input
                id="game-package-name"
                value={packageName}
                onChange={(e) => setPackageNameInput(e.target.value)}
                placeholder="com.exemplo.jogo"
                disabled={savingPackageName}
              />
              <Button type="button" variant="outline" size="sm" loading={savingPackageName} onClick={handleSavePackageName}>
                Salvar
              </Button>
            </div>
          </div>
          <div className="space-y-sm">
            <label htmlFor="game-bundle-identifier" className="text-sm font-medium">
              Bundle Identifier (App Store)
            </label>
            <div className="flex gap-sm">
              <Input
                id="game-bundle-identifier"
                value={bundleIdentifier}
                onChange={(e) => setBundleIdentifierInput(e.target.value)}
                placeholder="com.exemplo.jogo"
                disabled={savingBundleIdentifier}
              />
              <Button type="button" variant="outline" size="sm" loading={savingBundleIdentifier} onClick={handleSaveBundleIdentifier}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
