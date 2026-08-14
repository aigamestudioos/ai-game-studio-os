import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Sprint 2.12b — primeira config de teste de componente React do projeto
// (nenhuma existia antes; os demais packages só têm `build`/`typecheck`/
// `lint`). jsdom + Testing Library, mesmo par já padrão para Next.js App
// Router com Server Actions mockáveis via vi.mock.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
