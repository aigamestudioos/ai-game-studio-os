import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "../components/ui/toast";
import { TooltipProvider } from "../components/ui/tooltip";
import { ThemeProvider } from "../providers/theme-provider";
import "./globals.css";

const SITE_URL = "https://ai-game-studio-os-web.vercel.app";
const TITLE = "AI Game Studio OS";
const DESCRIPTION =
  "Sistema Operacional para Estúdios de Jogos Mobile AI-First — da ideia à publicação, com a IA como sua equipe.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s — ${TITLE}`,
  },
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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
