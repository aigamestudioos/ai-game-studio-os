"use client";

import { createPlatformsRepository, type PlatformsRow } from "@agsos/database";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../../../components/layout/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Spinner } from "../../../components/ui/spinner";
import { Textarea } from "../../../components/ui/textarea";
import { useAuth } from "../../../hooks/use-auth";
import { useCurrentStudio } from "../../../hooks/use-current-studio";
import { useStoreConnections } from "../../../hooks/use-store-connections";
import { toast } from "../../../hooks/use-toast";
import { getBrowserClient } from "../../../lib/supabase-client";
import { storeConnectionStatusLabel, storeConnectionStatusVariant } from "../../../lib/store-connection-status";

// Sprint 2.9 — só Apple está de fato cadastrável/validável nesta tela
// (Google Play fora de escopo, por decisão explícita do usuário). O
// formulário não expõe um seletor de provider por isso — quando o Google
// Play adapter existir, esta tela ganha o seletor, não antes.
type AppleForm = { displayName: string; issuerId: string; keyId: string; teamId: string; privateKey: string };

const EMPTY_FORM: AppleForm = { displayName: "", issuerId: "", keyId: "", teamId: "", privateKey: "" };

type DiscoveredApp = { id: string; name: string; bundleId: string; sku: string };

export default function StoreConnectionsPage() {
  const { session } = useAuth();
  const { studio } = useCurrentStudio(session);
  const { connections, error, createConnection, updateDisplayName, reconnect, disconnect, removeConnection, validate } =
    useStoreConnections(session, studio?.id);

  const [platforms, setPlatforms] = useState<PlatformsRow[] | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<AppleForm>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AppleForm>(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [validatingId, setValidatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    createPlatformsRepository(getBrowserClient())
      .list()
      .then(setPlatforms)
      .catch(() => setPlatforms([]));
  }, [session]);

  const appStorePlatform = platforms?.find((p) => p.name === "App Store");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appStorePlatform) return;
    setCreateError(null);
    setCreateLoading(true);
    try {
      const result = await createConnection({
        platformId: appStorePlatform.id,
        displayName: form.displayName.trim(),
        credentials: { issuerId: form.issuerId.trim(), keyId: form.keyId.trim(), teamId: form.teamId.trim(), privateKey: form.privateKey.trim() },
      });
      if (result.error) {
        setCreateError(result.error);
        return;
      }
      toast({ title: "Conexão criada", description: "Clique em Validate para confirmar as credenciais.", variant: "success" });
      setForm(EMPTY_FORM);
      setCreateOpen(false);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setEditError(null);
    setEditLoading(true);
    try {
      const nameResult = await updateDisplayName(editingId, editForm.displayName.trim());
      if (nameResult.error) {
        setEditError(nameResult.error);
        return;
      }
      if (editForm.issuerId || editForm.keyId || editForm.teamId || editForm.privateKey) {
        const credResult = await reconnect(editingId, {
          issuerId: editForm.issuerId.trim(),
          keyId: editForm.keyId.trim(),
          teamId: editForm.teamId.trim(),
          privateKey: editForm.privateKey.trim(),
        });
        if (credResult.error) {
          setEditError(credResult.error);
          return;
        }
      }
      toast({ title: "Conexão atualizada", variant: "success" });
      setEditingId(null);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleValidate(id: string) {
    setValidatingId(id);
    try {
      const result = await validate(id);
      if (result.error) {
        toast({ title: "Falha na validação", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Conexão validada", description: `${result.appsCount ?? 0} App(s) encontrado(s).`, variant: "success" });
      }
    } finally {
      setValidatingId(null);
    }
  }

  async function handleDisconnect(id: string, name: string) {
    if (!window.confirm(`Desconectar "${name}"? As credenciais salvas serão apagadas.`)) return;
    const result = await disconnect(id);
    if (result.error) toast({ title: "Não foi possível desconectar", description: result.error, variant: "destructive" });
    else toast({ title: "Desconectado", variant: "success" });
  }

  async function handleRemove(id: string, name: string) {
    if (!window.confirm(`Remover "${name}" definitivamente?`)) return;
    const result = await removeConnection(id);
    if (result.error) toast({ title: "Não foi possível remover", description: result.error, variant: "destructive" });
    else toast({ title: "Conexão removida", variant: "success" });
  }

  return (
    <AppShell breadcrumbs={[{ label: "Settings", href: "/settings/studio" }, { label: "Store Connections" }]}>
      <div className="mx-auto max-w-3xl space-y-lg p-lg">
        <section className="flex items-center justify-between gap-sm">
          <div>
            <h1 className="text-2xl font-semibold">Store Connections</h1>
            <p className="text-muted-foreground">Conecte suas contas da Apple e do Google para publicar seus jogos.</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!appStorePlatform}>Add Connection</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Nova conexão — Apple App Store Connect</DialogTitle>
                  <DialogDescription>
                    Gere uma API Key em App Store Connect → Users and Access → Integrations. As credenciais ficam
                    guardadas no Supabase Vault — nunca em texto puro.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-md">
                  <div className="space-y-sm">
                    <label htmlFor="sc-name" className="text-sm font-medium">
                      Nome amigável
                    </label>
                    <Input id="sc-name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required disabled={createLoading} />
                  </div>
                  <div className="grid grid-cols-2 gap-sm">
                    <div className="space-y-sm">
                      <label htmlFor="sc-issuer" className="text-sm font-medium">
                        Issuer ID
                      </label>
                      <Input id="sc-issuer" value={form.issuerId} onChange={(e) => setForm({ ...form, issuerId: e.target.value })} required disabled={createLoading} />
                    </div>
                    <div className="space-y-sm">
                      <label htmlFor="sc-keyid" className="text-sm font-medium">
                        Key ID
                      </label>
                      <Input id="sc-keyid" value={form.keyId} onChange={(e) => setForm({ ...form, keyId: e.target.value })} required disabled={createLoading} />
                    </div>
                  </div>
                  <div className="space-y-sm">
                    <label htmlFor="sc-team" className="text-sm font-medium">
                      Team ID
                    </label>
                    <Input id="sc-team" value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })} required disabled={createLoading} />
                  </div>
                  <div className="space-y-sm">
                    <label htmlFor="sc-key" className="text-sm font-medium">
                      Private Key (.p8)
                    </label>
                    <Textarea
                      id="sc-key"
                      value={form.privateKey}
                      onChange={(e) => setForm({ ...form, privateKey: e.target.value })}
                      placeholder="-----BEGIN PRIVATE KEY-----..."
                      required
                      disabled={createLoading}
                      className="font-mono text-xs"
                      rows={5}
                    />
                  </div>
                  {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
                </div>
                <DialogFooter>
                  <Button type="submit" loading={createLoading} disabled={createLoading}>
                    Criar conexão
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!connections ? (
          <div className="flex justify-center py-2xl">
            <Spinner size="lg" />
          </div>
        ) : connections.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conexão ainda — clique em "Add Connection" acima.</p>
        ) : (
          <div className="space-y-md">
            {connections.map((connection) => {
              const apps = (connection.metadata?.apps as DiscoveredApp[] | undefined) ?? [];
              return (
                <Card key={connection.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-sm">
                    <div>
                      <CardTitle className="text-base">{connection.display_name ?? "Sem nome"}</CardTitle>
                      <p className="text-xs text-muted-foreground">Apple App Store Connect</p>
                    </div>
                    <Badge variant={storeConnectionStatusVariant(connection.status)}>{storeConnectionStatusLabel(connection.status)}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-md">
                    <div className="flex flex-wrap items-center gap-md text-xs text-text-tertiary">
                      <span>
                        Última validação:{" "}
                        {connection.last_validation_at ? new Date(connection.last_validation_at).toLocaleString("pt-BR") : "nunca"}
                      </span>
                      <span>{apps.length} App(s) encontrado(s)</span>
                    </div>

                    {connection.last_error ? <p className="text-sm text-destructive">{connection.last_error}</p> : null}

                    {apps.length > 0 ? (
                      <ul className="space-y-1 rounded-sm border border-border p-sm">
                        {apps.map((app) => (
                          <li key={app.id} className="flex items-center gap-sm text-sm">
                            <span className="font-medium">{app.name}</span>
                            <span className="text-muted-foreground">{app.bundleId}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="flex flex-wrap gap-sm">
                      <Button size="sm" loading={validatingId === connection.id} onClick={() => handleValidate(connection.id)}>
                        Validate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDisconnect(connection.id, connection.display_name ?? "")}>
                        Disconnect
                      </Button>
                      <Dialog open={editingId === connection.id} onOpenChange={(open) => setEditingId(open ? connection.id : null)}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditForm({ ...EMPTY_FORM, displayName: connection.display_name ?? "" })}
                          >
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <form onSubmit={handleEditSubmit}>
                            <DialogHeader>
                              <DialogTitle>Editar conexão</DialogTitle>
                              <DialogDescription>
                                Deixe os campos de credencial em branco para manter a credencial atual — preencha só se
                                quiser trocá-la.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-md">
                              <div className="space-y-sm">
                                <label htmlFor="edit-name" className="text-sm font-medium">
                                  Nome amigável
                                </label>
                                <Input id="edit-name" value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} required disabled={editLoading} />
                              </div>
                              <div className="grid grid-cols-2 gap-sm">
                                <div className="space-y-sm">
                                  <label htmlFor="edit-issuer" className="text-sm font-medium">
                                    Issuer ID
                                  </label>
                                  <Input id="edit-issuer" value={editForm.issuerId} onChange={(e) => setEditForm({ ...editForm, issuerId: e.target.value })} disabled={editLoading} />
                                </div>
                                <div className="space-y-sm">
                                  <label htmlFor="edit-keyid" className="text-sm font-medium">
                                    Key ID
                                  </label>
                                  <Input id="edit-keyid" value={editForm.keyId} onChange={(e) => setEditForm({ ...editForm, keyId: e.target.value })} disabled={editLoading} />
                                </div>
                              </div>
                              <div className="space-y-sm">
                                <label htmlFor="edit-team" className="text-sm font-medium">
                                  Team ID
                                </label>
                                <Input id="edit-team" value={editForm.teamId} onChange={(e) => setEditForm({ ...editForm, teamId: e.target.value })} disabled={editLoading} />
                              </div>
                              <div className="space-y-sm">
                                <label htmlFor="edit-key" className="text-sm font-medium">
                                  Private Key (.p8)
                                </label>
                                <Textarea
                                  id="edit-key"
                                  value={editForm.privateKey}
                                  onChange={(e) => setEditForm({ ...editForm, privateKey: e.target.value })}
                                  className="font-mono text-xs"
                                  rows={5}
                                  disabled={editLoading}
                                />
                              </div>
                              {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
                            </div>
                            <DialogFooter>
                              <Button type="submit" loading={editLoading} disabled={editLoading}>
                                Salvar
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="ghost" onClick={() => handleRemove(connection.id, connection.display_name ?? "")}>
                        Remover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
