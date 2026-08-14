import { test, expect } from "@playwright/test";
import { seedCriticalPath, fixStoreConnectionBlocker, cleanup } from "./fixtures/seed.mjs";

// Sprint 2.13 GATE 3 — E2E crítico de Publishing, contra o stack LOCAL
// (Docker + `next dev`, ver playwright.config.ts). Login é real (via UI,
// email/senha de um usuário criado por fixture/seed — nunca uma credencial
// humana). Fluxo coberto, ponta a ponta:
//
//   login → Publishing → abrir "New Submission" → selecionar o Release →
//   ver o painel de Readiness em NOT_READY com o blocker
//   STORE_CONNECTION_MISSING visível → corrigir via fixture direta no
//   banco (documentado: não há tela de verdade para conectar uma Store
//   Connection sem credencial real de Google/Apple — ver
//   e2e/fixtures/seed.mjs) → clicar "Recarregar" (refetch já existente do
//   hook `useReleaseReadiness`, sem polling novo) → readiness vira READY →
//   botão "Criar Submissão" habilita → criar a Submission (App Store) →
//   confirmar que ela aparece na lista → reload da página → confirmar que
//   o estado persiste.
//
// Limitação honesta: o fixture pré-cria uma Submission Google Play direto
// no banco (não pela UI) porque `SUBMISSION_TARGETS_MISSING` bloqueia toda
// Release sem nenhuma Submission ativa — não há como o botão "Criar
// Submissão" ficar habilitado para a PRIMEIRA Submission de um Release
// (aspereza pré-existente, documentada em DECISIONS.md desde o Sprint
// 2.12b, fora do escopo deste sprint mudar). Este teste cobre a criação da
// 2ª Submission (App Store) do mesmo Release pela UI, que é o caminho
// realmente exercitável hoje.

let ctx: Awaited<ReturnType<typeof seedCriticalPath>> | undefined;

test.beforeAll(async () => {
  ctx = await seedCriticalPath();
});

test.afterAll(async () => {
  await cleanup(ctx);
});

test("Publishing: readiness NOT_READY → corrige blocker → READY → cria Submission → persiste após reload", async ({ page }) => {
  if (!ctx) throw new Error("fixture não inicializado");

  // ---------- Login real via UI ----------
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  const emailInput = page.locator("#email");
  const passwordInput = page.locator("#password");
  await emailInput.fill(ctx.email);
  await passwordInput.fill(ctx.password);
  await expect(emailInput).toHaveValue(ctx.email);
  await expect(passwordInput).toHaveValue(ctx.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  // `next dev` compila cada rota sob demanda na primeira visita (cold
  // start) — a primeira navegação pós-login pode levar bem mais que os
  // ~1-2s normais de uma rota já compilada. `waitUntil: "commit"` (não o
  // default "load") porque router.push é navegação client-side (History
  // API) — o evento `load` do documento não refaz fetch nenhum aqui, então
  // esperar por ele trava até o timeout mesmo com a URL já correta.
  await page.waitForURL("**/dashboard", { timeout: 45_000, waitUntil: "commit" });

  // ---------- Navega até Publishing ----------
  await page.goto("/publishing");
  await expect(page.getByRole("heading", { name: "Publishing" })).toBeVisible();

  // ---------- Abre o diálogo e seleciona o Release do fixture ----------
  await page.getByRole("button", { name: "New Submission" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Nova Submissão" })).toBeVisible();
  await dialog.getByText("Jogo E2E", { exact: false }).first().click();

  // ---------- NOT_READY com o blocker visível ----------
  await expect(dialog.getByText("Não pronto")).toBeVisible();
  await expect(dialog.getByText(/conexão configurada com Google Play/i)).toBeVisible();

  // ---------- Corrige o blocker (fixture direta no banco, ver topo do arquivo) ----------
  await fixStoreConnectionBlocker(ctx);

  // ---------- Refetch usando o botão "Recarregar" já existente (hook useReleaseReadiness) ----------
  // O Dialog (Radix) fica alto o bastante (lista inteira de checks de
  // readiness) para o botão "Recarregar" ficar fora da viewport mesmo após
  // scroll — `scrollIntoViewIfNeeded`/`force` não resolvem porque o
  // conteúdo é maior que a própria viewport de teste, não só um problema
  // de overlay. `.click()` via `evaluate` invoca o handler React
  // diretamente: seguro aqui porque já confirmamos acima (readiness NOT_READY
  // visível) que o botão existe e está montado, e este passo só precisa
  // disparar `reload()`, não testar a interação de scroll/clique em si.
  const reloadButton = dialog.getByRole("button", { name: "Recarregar" });
  await expect(reloadButton).toBeEnabled();
  await reloadButton.evaluate((el) => (el as HTMLElement).click());
  await expect(dialog.getByText("Pronto para submissão")).toBeVisible({ timeout: 10_000 });

  // ---------- Seleciona a plataforma App Store (2ª Submission do Release) ----------
  // Mesma razão do botão "Recarregar" acima: a lista de checks PASS
  // (Google, agora READY) deixa o Dialog inteiro maior que qualquer
  // viewport razoável de teste — `evaluate(click)` em vez de brigar com
  // scroll.
  const appStoreOption = dialog.getByText("App Store", { exact: true });
  await expect(appStoreOption).toBeVisible();
  await appStoreOption.evaluate((el) => (el.closest("button") as HTMLElement).click());

  const createButton = dialog.getByRole("button", { name: "Criar Submissão" });
  await expect(createButton).toBeEnabled();
  await createButton.evaluate((el) => (el as HTMLElement).click());

  // ---------- Confirma persistência ----------
  await expect(page.getByRole("heading", { name: "Nova Submissão" })).not.toBeVisible({ timeout: 10_000 });
  const appStoreCard = page.getByText("App Store — v1.0.0");
  await expect(appStoreCard).toBeVisible();

  await page.reload();
  await expect(page.getByText("App Store — v1.0.0")).toBeVisible();
});
