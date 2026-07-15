"use client";

import { useTheme } from "../hooks/use-theme";

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-background p-lg text-foreground">
      <h1 className="text-2xl font-semibold">AI Game Studio OS</h1>
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-md border border-border bg-secondary px-md py-sm text-secondary-foreground shadow-sm"
      >
        Tema atual: {theme === "dark" ? "escuro" : "claro"} (alternar)
      </button>
    </main>
  );
}
