"use client";

import { Bell, Menu } from "lucide-react";
import { useTheme } from "../../hooks/use-theme";
import { Button } from "../ui/button";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { SearchBar } from "./search-bar";
import { UserMenu } from "./user-menu";

export type Breadcrumb = { label: string; href?: string };

// TopBar — cabeçalho reutilizado por toda a Application Shell (Dashboard, Projects,
// Games...). Sem props, renderiza uma versão mínima (usada no Playground); com
// `breadcrumbs`, mostra o cabeçalho completo usado pelas telas reais.
export function TopBar({
  breadcrumbs,
  onMenuClick,
}: {
  breadcrumbs?: Breadcrumb[];
  onMenuClick?: () => void;
}) {
  const { toggleTheme, theme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center gap-md border-b border-border bg-surface-base px-lg">
      <div className="flex items-center gap-sm">
        {breadcrumbs && onMenuClick ? (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Abrir menu"
          >
            <Menu className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
        <span className="text-sm font-semibold">AI Game Studio OS</span>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="hidden items-center gap-sm text-sm text-text-tertiary sm:flex">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.label} className="flex items-center gap-sm">
                <span aria-hidden="true">/</span>
                <span className={index === breadcrumbs.length - 1 ? "text-foreground" : undefined}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        ) : null}
      </div>

      {breadcrumbs ? <SearchBar className="ml-auto" /> : <div className="ml-auto" />}

      {breadcrumbs ? (
        <>
          <UiTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notificações">
                <Bell className="size-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notificações</TooltipContent>
          </UiTooltip>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === "dark" ? "☀︎" : "☾"}
          </Button>

          <UserMenu />
        </>
      ) : (
        <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === "dark" ? "☀︎" : "☾"}
        </Button>
      )}
    </header>
  );
}
