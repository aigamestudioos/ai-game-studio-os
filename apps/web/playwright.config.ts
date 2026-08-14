import { defineConfig, devices } from "@playwright/test";

// Sprint 2.13 GATE 3 — E2E foundation. Roda SÓ contra o stack local
// (Docker + `next dev`), nunca produção: `baseURL` é sempre localhost, sem
// nenhuma variável de ambiente que permita apontar para fora — a mesma
// postura de `scripts/test-readiness-golden-path.mjs` (Sprint 2.12c) e do
// fixture em `e2e/fixtures/seed.mjs`, que recusa rodar se
// `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` não apontarem para
// localhost/127.0.0.1.
const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 4000 },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // `next start` (build de produção), não `next dev` — `next dev` (Webpack,
  // sem Turbopack neste projeto) serve chunks incompletos na primeiríssima
  // visita de cada rota sob carga, quebrando o mount do React em plena
  // corrida com o Playwright ("Invalid or unexpected token" no console,
  // sem nenhum erro visível na tela — achado deste GATE 3). `pnpm run
  // build` roda antes do `test:e2e` (ver package.json).
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
