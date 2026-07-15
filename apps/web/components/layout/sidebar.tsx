"use client";

import {
  BarChart3,
  BookOpen,
  Building2,
  FolderKanban,
  Gamepad2,
  LayoutDashboard,
  Megaphone,
  Rocket,
  Settings,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "../../lib/utils";

// Ordem oficial — SPEC-005 §9 "Layout Padrão"
const NAV_ITEMS: { label: string; href?: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Studio", icon: Building2 },
  { label: "Projects", icon: FolderKanban },
  { label: "Games", icon: Gamepad2 },
  { label: "AI", icon: Sparkles },
  { label: "Publishing", icon: Rocket },
  { label: "Marketing", icon: Megaphone },
  { label: "Analytics", icon: BarChart3 },
  { label: "Finance", icon: Wallet },
  { label: "Knowledge", icon: BookOpen },
  { label: "Settings", icon: Settings },
];

export function Sidebar({ active = "Dashboard" }: { active?: string }) {
  return (
    <nav className="flex h-full w-56 shrink-0 flex-col gap-sm border-r border-border bg-surface-base p-md">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive = label === active;
        const content = (
          <span
            className={cn(
              "flex items-center gap-sm rounded-md px-sm py-sm text-sm transition-colors",
              isActive
                ? "bg-secondary font-medium text-secondary-foreground"
                : href
                  ? "text-foreground hover:bg-secondary"
                  : "cursor-not-allowed text-text-disabled",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </span>
        );

        if (!href) {
          return (
            <span key={label} aria-disabled="true">
              {content}
            </span>
          );
        }

        return (
          <Link key={label} href={href}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
