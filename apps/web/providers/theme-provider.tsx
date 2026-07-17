"use client";

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../hooks/use-auth";

export type Theme = "dark" | "light";

export type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { session, updateProfile } = useAuth();
  const [theme, setThemeState] = useState<Theme>("dark");
  // Evita persistir de volta o tema que acabamos de carregar da própria sessão.
  const appliedSavedTheme = useRef(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setThemeState(current);
  }, []);

  // Aplica o tema salvo do usuário (auth.users.user_metadata.theme) assim que
  // a sessão carrega — só uma vez por sessão, para não sobrescrever um toggle
  // manual do usuário caso a leitura da sessão chegue atrasada.
  useEffect(() => {
    if (!session || appliedSavedTheme.current) return;
    appliedSavedTheme.current = true;
    const savedTheme = session.user.user_metadata?.theme as Theme | undefined;
    if (savedTheme && savedTheme !== theme) {
      applyTheme(savedTheme);
      setThemeState(savedTheme);
    }
  }, [session, theme]);

  const setTheme = useCallback(
    (next: Theme) => {
      applyTheme(next);
      setThemeState(next);
      if (session) {
        // Falha em persistir não deve quebrar a troca de tema local — o
        // usuário já vê o resultado; só perde a persistência entre sessões.
        updateProfile({ theme: next }).catch(() => {});
      }
    },
    [session, updateProfile],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
