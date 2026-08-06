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
import { useIntegrationHealth } from "../../../hooks/use-integration-health";
import { toast } from "../../../hooks/use-toast";
import { getBrowserClient } from "../../../lib/supabase-client";
import {
  integrationHealthStatusLabel,
  integrationHealthStatusVariant,
  storeConnectionStatusLabel,
  storeConnectionStatusVariant,
} from "../../../lib/store-connection-status";

// Sprint 2.9 (Apple) + Sprint 2.10 (Google Play) — seletor de provider no
// formulário de criação; cada provider tem seus próprios campos de
// credencial porque os formatos são reais e diferentes (Apple: Issuer
// ID/Key ID/Team ID/.p8; Google: JSON de Service Account + Package Name).
type Provider = "apple" | "google";

type AppleForm = { displayName: string; issuerId: string; keyId: string; teamId: string; privateKey: string };
type GoogleForm = { displayName: string; packageName: string; serviceAccountJson: string };

const EMPTY_APPLE_FORM: AppleForm = { displayName: "", issuerId: "", keyId: "", teamId: "", privateKey: "" };
const EMPTY_GOOGLE_FORM: GoogleForm = { displayName: "", packageName: "", serviceAccountJson: "" };

type DiscoveredApp = { id: string; name: string; bundleId?: string; sku?: string; packageName?: string };

// Sprint 2.10.1 — Integration Health. `null` (janela sem chamadas) vira
// "—", nunca "0%" — 0% de sucesso de 0 chamadas seria uma afirmação falsa.
function formatPercent(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

function formatMs(ms: number | null): string {
  return ms === null ? "—" : `${Math.round(ms)}ms`;
}

const OPERATION_LABELS: Record<string, string> = {
  HEALTH: "Health check",
  LIST_APPS: "Listar Apps",
  CONNECT: "Conectar",
  DISCONNECT: "Desconectar",
};

export default function StoreConnectionsPage() {
  const { session } = useAuth();
  const { studio } = useCurrentStudio(session);
  const { connections, error, createConnection, updateDisplayName, reconnect, disconnect, removeConnection, validate } =
    useStoreConnections(session, studio?.id);
  const { summaries: healthSummaries, refresh: refreshHealth } = useIntegrationHealth(session);

  const [platforms, setPlatforms] = useState<PlatformsRow[] | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [provider, setProvider] = useState<Provider>("apple");
  const [form, setForm] = useState<AppleForm>(EMPTY_APPLE_FORM);
  const [googleForm, setGoogleForm] = useState<GoogleForm>(EMPTY_GOOGLE_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AppleForm>(EMPTY_APPLE_FORM);
  const [editGoogleForm, setEditGoogleForm] = useState<GoogleForm>(EMPTY_GOOGLE_FORM);
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
  const googlePlayPlatform = platforms?.find((p) => p.name === "Google Play");
  const selectedPlatform = provider === "apple" ? appStorePlatform : googlePlayPlatform;

  function platformName(platformId: string): string {
    return platforms?.find((p) => p.id === platformId)?.name ?? "Desconhecido";
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlatform) return;
    setCreateError(null);
    setCreateLoading(true);
    try {
      const result =
        provider === "apple"
          ? await createConnection({
              platformId: selectedPlatform.id,
              displayName: form.displayName.trim(),
              credentials: { issuerId: form.issuerId.trim(), keyId: form.keyId.trim(), teamId: form.teamId.trim(), privateKey: form.privateKey.trim() },
            })
          : await createConnection({
              platformId: selectedPlatform.id,
              displayName: googleForm.displayName.trim(),
              credentials: { packageName: googleForm.packageName.trim(), serviceAccountJson: googleForm.serviceAccountJson.trim() },
            });
      if (result.error) {
        setCreateError(result.error);
        return;
      }
      toast({ title: "Conexão criada", description: "Clique em Validate para confirmar as credenciais.", variant: "success" });
      setForm(EMPTY_APPLE_FORM);
      setGoogleForm(EMPTY_GOOGLE_FORM);
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
      const connection = connections?.find((c) => c.id === editingId);
      const isGoogle = connection ? platformName(connection.platform_id) === "Google Play" : false;
      if (isGoogle) {
        if (editGoogleForm.packageName || editGoogleForm.serviceAccountJson) {
          const credResult = await reconnect(editingId, {
            packageName: editGoogleForm.packageName.trim(),
            serviceAccountJson: editGoogleForm.serviceAccountJson.trim(),
          });
          if (credResult.error) {
            setEditError(credResult.error);
            return;
          }
        }
      } else if (editForm.issuerId || editForm.keyId || editForm.teamId || editForm.privateKey) {
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
      // Refletir a chamada que acabou de acontecer no painel de Integration
      // Health, sucesso ou falha — nunca esperar um poll para isso.
      await refreshHealth();
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
              <Button disabled={!appStorePlatform && !googlePlayPlatform}>Add Connection</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>
                    Nova conexão — {provider === "apple" ? "Apple App Store Connect" : "Google Play"}
                  </DialogTitle>
                  <DialogDescription>
                    {provider === "apple"
                      ? "Gere uma API Key em App Store Connect → Users and Access → Integrations. As credenciais ficam guardadas no Supabase Vault — nunca em texto puro."
                      : "Crie uma Service Account no Google Cloud Console, dê acesso a ela no Play Console (Users and permissions) e cole o JSON da chave abaixo. As credenciais ficam guardadas no Supabase Vault — nunca em texto puro."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-md">
                  <div className="space-y-sm">
                    <label htmlFor="sc-provider" className="text-sm font-medium">
                      Provider
                    </label>
                    <div className="flex gap-sm">
                      <Button
                        type="button"
                        size="sm"
                        variant={provider === "apple" ? "default" : "outline"}
                        disabled={!appStorePlatform || createLoading}
                        onClick={() => setProvider("apple")}
                      >
                        Apple App Store
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={provider === "google" ? "default" : "outline"}
                        disabled={!googlePlayPlatform || createLoading}
                        onClick={() => setProvider("google")}
                      >
                        Google Play
                      </Button>
                    </div>
                  </div>

                  {provider === "apple" ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <div className="space-y-sm">
                        <label htmlFor="gp-name" className="text-sm font-medium">
                          Nome amigável
                        </label>
                        <Input id="gp-name" value={googleForm.displayName} onChange={(e) => setGoogleForm({ ...googleForm, displayName: e.target.value })} required disabled={createLoading} />
                      </div>
                      <div className="space-y-sm">
                        <label htmlFor="gp-package" className="text-sm font-medium">
                          Package Name
                        </label>
                        <Input
                          id="gp-package"
                          value={googleForm.packageName}
                          onChange={(e) => setGoogleForm({ ...googleForm, packageName: e.target.value })}
                          placeholder="com.estudio.jogo"
                          required
                          disabled={createLoading}
                        />
                      </div>
                      <div className="space-y-sm">
                        <label htmlFor="gp-json" className="text-sm font-medium">
                          Service Account JSON
                        </label>
                        <Textarea
                          id="gp-json"
                          value={googleForm.serviceAccountJson}
                          onChange={(e) => setGoogleForm({ ...googleForm, serviceAccountJson: e.target.value })}
                          placeholder='{"client_email": "...", "private_key": "..." }'
                          required
                          disabled={createLoading}
                          className="font-mono text-xs"
                          rows={5}
                        />
                      </div>
                    </>
                  )}
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
              const isGoogle = platformName(connection.platform_id) === "Google Play";
              const health = healthSummaries?.find((h) => h.storeConnectionId === connection.id);
              return (
                <Card key={connection.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-sm">
                    <div>
                      <CardTitle className="text-base">{connection.display_name ?? "Sem nome"}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {isGoogle ? "Google Play" : "Apple App Store Connect"}
                      </p>
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

                    {health ? (
                      <div className="space-y-sm rounded-sm border border-border p-sm">
                        <div className="flex items-center justify-between gap-sm">
                          <span className="text-xs font-medium text-muted-foreground">Integration Health</span>
                          <Badge variant={integrationHealthStatusVariant(health.status)}>{integrationHealthStatusLabel(health.status)}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-sm text-xs sm:grid-cols-4">
                          <div>
                            <div className="text-text-tertiary">Success 24h</div>
                            <div className="font-medium">{formatPercent(health.window24h.successRate)}</div>
                          </div>
                          <div>
                            <div className="text-text-tertiary">Failure 24h</div>
                            <div className="font-medium">{formatPercent(health.window24h.failureRate)}</div>
                          </div>
                          <div>
                            <div className="text-text-tertiary">Success 7d</div>
                            <div className="font-medium">{formatPercent(health.window7d.successRate)}</div>
                          </div>
                          <div>
                            <div className="text-text-tertiary">Failure 7d</div>
                            <div className="font-medium">{formatPercent(health.window7d.failureRate)}</div>
                          </div>
                          <div>
                            <div className="text-text-tertiary">Call Count (7d)</div>
                            <div className="font-medium">{health.window7d.totalCalls}</div>
                          </div>
                          <div>
                            <div className="text-text-tertiary">Retry Rate (7d)</div>
                            <div className="font-medium">{formatPercent(health.window7d.retryRate)}</div>
                          </div>
                          <div>
                            <div className="text-text-tertiary">Latência média (7d)</div>
                            <div className="font-medium">{formatMs(health.window7d.avgLatencyMs)}</div>
                          </div>
                          <div>
                            <div className="text-text-tertiary">Última duração</div>
                            <div className="font-medium">{formatMs(health.lastCheck?.durationMs ?? null)}</div>
                          </div>
                        </div>

                        <div className="text-xs text-text-tertiary">
                          {health.lastCheck ? (
                            <>
                              Última chamada: {new Date(health.lastCheck.occurredAt).toLocaleString("pt-BR")} —{" "}
                              {health.lastCheck.success ? "sucesso" : `erro (${health.lastCheck.errorCode ?? "desconhecido"})`}
                            </>
                          ) : (
                            "Nenhuma chamada registrada ainda."
                          )}
                        </div>

                        {health.recentCalls.length > 0 ? (
                          <ul className="space-y-1 text-xs">
                            {health.recentCalls.slice(0, 5).map((call, idx) => (
                              <li key={idx} className="flex items-center justify-between gap-sm text-text-tertiary">
                                <span>
                                  {OPERATION_LABELS[call.payload.operation] ?? call.payload.operation} —{" "}
                                  {new Date(call.occurred_at).toLocaleTimeString("pt-BR")}
                                </span>
                                <span className={call.payload.success ? "text-success" : "text-destructive"}>
                                  {call.payload.success ? "OK" : (call.payload.errorCode ?? "ERRO")} · {formatMs(call.payload.durationMs)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}

                    {apps.length > 0 ? (
                      <ul className="space-y-1 rounded-sm border border-border p-sm">
                        {apps.map((app) => (
                          <li key={app.id} className="flex items-center gap-sm text-sm">
                            <span className="font-medium">{app.name}</span>
                            <span className="text-muted-foreground">{app.bundleId ?? app.packageName}</span>
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
                            onClick={() => {
                              setEditForm({ ...EMPTY_APPLE_FORM, displayName: connection.display_name ?? "" });
                              setEditGoogleForm({ ...EMPTY_GOOGLE_FORM, displayName: connection.display_name ?? "" });
                            }}
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
                              {isGoogle ? (
                                <>
                                  <div className="space-y-sm">
                                    <label htmlFor="edit-gp-package" className="text-sm font-medium">
                                      Package Name
                                    </label>
                                    <Input
                                      id="edit-gp-package"
                                      value={editGoogleForm.packageName}
                                      onChange={(e) => setEditGoogleForm({ ...editGoogleForm, packageName: e.target.value })}
                                      disabled={editLoading}
                                    />
                                  </div>
                                  <div className="space-y-sm">
                                    <label htmlFor="edit-gp-json" className="text-sm font-medium">
                                      Service Account JSON
                                    </label>
                                    <Textarea
                                      id="edit-gp-json"
                                      value={editGoogleForm.serviceAccountJson}
                                      onChange={(e) => setEditGoogleForm({ ...editGoogleForm, serviceAccountJson: e.target.value })}
                                      className="font-mono text-xs"
                                      rows={5}
                                      disabled={editLoading}
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
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
                                </>
                              )}
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
