import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "../components/ui/toast";
import { TooltipProvider } from "../components/ui/tooltip";
import { ThemeProvider } from "../providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Game Studio OS",
  description: "Sistema Operacional para Estúdios de Jogos Mobile AI-First",
};

const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (_) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground">
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
