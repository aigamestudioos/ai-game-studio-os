import { test, expect } from "@playwright/test";
import { seedCriticalPath, fixStoreConnectionBlocker, cleanup } from "./fixtures/seed.mjs";

// Sprint 2.13 GATE 3 / Sprint 2.14 GATE 1+4 / Sprint 2.15 GATE 17+31 — E2E
// crítico de Publishing, contra o stack LOCAL (Docker + `next start`, ver
// playwright.config.ts). Login é real (via UI, email/senha de um usuário
// criado por fixture/seed — nunca uma credencial humana). Fluxo coberto,
// ponta a ponta:
//
//   login → Game → Store Listing VAZIA (nenhuma seed de
//   `game_localizations` — ver e2e/fixtures/seed.mjs) → preenche e salva a
//   ficha de loja pela UI real → Publishing → Release READY, ZERO
//   Submissions (nenhuma seed artificial) → abrir "New Submission" →
//   selecionar o Release e a plataforma Google Play → botão "Criar
//   Submissão" já habilitado (GATE 9 revisado no 2.14:
//   `SUBMISSION_TARGETS_MISSING` não bloqueia a criação da 1ª Submission)
//   → criar a Submission (Google Play) pela UI real → confirmar que ela
//   aparece na lista → reload da página → confirmar que persiste → abrir
//   "New Submission" de novo → agora com 1 Submission ativa, o readiness
//   passa a avaliar os checks por Submission e mostra NOT_READY com o
//   blocker STORE_CONNECTION_MISSING → corrigir via fixture direta no
//   banco (documentado: não há tela de verdade para conectar uma Store
//   Connection sem credencial real de Google/Apple — ver
//   e2e/fixtures/seed.mjs) → "Recarregar" (refetch já existente do hook
//   `useReleaseReadiness`, sem polling novo) → READY → criar a 2ª
//   Submission (App Store) pela UI → persiste após reload.
//
// Sprint 2.14 fechou a limitação anterior: nenhuma Submission é
// pré-semeada no banco — a 1ª Submission do cenário nasce inteiramente
// pela UI, com os mesmos contratos do produto (ver DECISIONS.md/
// IMPLEMENTATION_LOG.md, Sprint 2.14, causa raiz de
// SUBMISSION_TARGETS_MISSING).
//
// Sprint 2.15 fecha a limitação irmã: `METADATA_LISTING_MISSING`
// (blocking=true, sempre avaliado, independente de Submission existir) só
// deixava de bloquear a criação da 1ª Submission porque o fixture semeava
// `game_localizations` direto no banco via service_role. Esse insert foi
// removido do fixture — a ficha de loja agora nasce pela UI (Game → Store
// Listing) dentro deste próprio teste, ANTES de abrir "New Submission"
// (senão `METADATA_LISTING_MISSING` bloquearia a 1ª Submission também,
// já que o Submission Gate só ignora `SUBMISSION_TARGETS_MISSING`).

let ctx: Awaited<ReturnType<typeof seedCriticalPath>> | undefined;

test.beforeAll(async () => {
  ctx = await seedCriticalPath();
});

test.afterAll(async () => {
  await cleanup(ctx);
});

test("Publishing: 1ª Submission sem seed → NOT_READY → corrige blocker → READY → 2ª Submission → persiste após reload", async ({ page }) => {
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
  // `next start` (build de produção) ainda pode levar mais que os ~1-2s
  // normais na primeira navegação pós-login sob carga do Playwright.
  // `waitUntil: "commit"` (não o default "load") porque router.push é
  // navegação client-side (History API) — o evento `load` do documento não
  // refaz fetch nenhum aqui, então esperar por ele trava até o timeout
  // mesmo com a URL já correta.
  await page.waitForURL("**/dashboard", { timeout: 45_000, waitUntil: "commit" });

  // ---------- GATE 31 (2.15) — Store Listing vazia, preenchida pela UI ----------
  // Nenhum insert de `game_localizations` foi feito pelo fixture (ver
  // e2e/fixtures/seed.mjs) — este é o critério decisivo do Sprint 2.15:
  // "apagando todos os atalhos de fixture relacionados a
  // `game_localizations`, o usuário ainda consegue chegar a READY?"
  await page.goto(`/games/${ctx.gameId}`);
  await expect(page.getByRole("heading", { name: "Store Listing" })).toBeVisible();
  await expect(page.getByText("Não cadastrada")).toBeVisible();
  await page.locator("#listing-title").fill("Jogo E2E — Store Listing");
  await page.locator("#listing-short").fill("Um jogo de teste E2E.");
  await page.locator("#listing-full").fill("Descrição completa da ficha de loja criada pela UI no E2E.");
  await page.locator("#listing-keywords").fill("e2e, teste, jogo");
  await page.getByRole("button", { name: "Salvar ficha de loja" }).click();
  await expect(page.getByText("Cadastrada")).toBeVisible({ timeout: 10_000 });

  // Reload confirma persistência da Store Listing antes de seguir o fluxo.
  await page.reload();
  await expect(page.getByText("Cadastrada")).toBeVisible();
  await expect(page.locator("#listing-title")).toHaveValue("Jogo E2E — Store Listing");

  // ---------- Navega até Publishing ----------
  await page.goto("/publishing");
  await expect(page.getByRole("heading", { name: "Publishing" })).toBeVisible();

  // ---------- GATE 1 — 1ª Submission (Google Play), ZERO Submissions no início ----------
  // Nenhum insert direto de Submission foi feito pelo fixture (ver
  // e2e/fixtures/seed.mjs) — este é o cenário real: Release READY, zero
  // Submissions, criada inteiramente pelo fluxo normal da aplicação.
  await page.getByRole("button", { name: "New Submission" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Nova Submissão" })).toBeVisible();
  await dialog.getByText("Jogo E2E", { exact: false }).first().click();

  // Sem nenhuma Submission ainda, `get_release_readiness` só tem checks de
  // nível Release (nenhum artifact/store connection é avaliado por
  // Submission inexistente) — o único FAIL possível é
  // `SUBMISSION_TARGETS_MISSING`, que o Submission Gate (2.14) não trata
  // como blocker de criação. Botão já habilita ao escolher a plataforma.
  const googlePlayOption = dialog.getByText("Google Play", { exact: true });
  await expect(googlePlayOption).toBeVisible();
  await googlePlayOption.evaluate((el) => (el.closest("button") as HTMLElement).click());

  const createFirstButton = dialog.getByRole("button", { name: "Criar Submissão" });
  await expect(createFirstButton).toBeEnabled();
  await createFirstButton.evaluate((el) => (el as HTMLElement).click());

  // ---------- Confirma persistência da 1ª Submission ----------
  await expect(page.getByRole("heading", { name: "Nova Submissão" })).not.toBeVisible({ timeout: 10_000 });
  const googlePlayCard = page.getByText("Google Play — v1.0.0");
  await expect(googlePlayCard).toBeVisible();

  await page.reload();
  await expect(page.getByText("Google Play — v1.0.0")).toBeVisible();

  // ---------- GATE 2 — agora com 1 Submission ativa, readiness passa a avaliar seus checks ----------
  await page.getByRole("button", { name: "New Submission" }).click();
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
