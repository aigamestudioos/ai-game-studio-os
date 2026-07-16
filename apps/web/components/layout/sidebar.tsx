"use client";

import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
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
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

// Ordem oficial — SPEC-005 §9 "Layout Padrão"
const NAV_ITEMS: { label: string; href?: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Studio", icon: Building2 },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Games", href: "/games", icon: Gamepad2 },
  { label: "AI", icon: Sparkles },
  { label: "Publishing", href: "/publishing", icon: Rocket },
  { label: "Marketing", icon: Megaphone },
  { label: "Analytics", icon: BarChart3 },
  { label: "Finance", icon: Wallet },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "Settings", icon: Settings },
];

export function SidebarItem({
  label,
  href,
  icon: Icon,
  active,
  collapsed,
}: {
  label: string;
  href?: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}) {
  const content = (
    <span
      className={cn(
        "flex items-center gap-sm rounded-md px-sm py-sm text-sm transition-colors",
        collapsed && "justify-center",
        active
          ? "bg-secondary font-medium text-secondary-foreground"
          : href
            ? "text-foreground hover:bg-secondary"
            : "cursor-not-allowed text-text-disabled",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {collapsed ? <span className="sr-only">{label}</span> : label}
    </span>
  );

  const item = href ? (
    <Link href={href} aria-current={active ? "page" : undefined}>
      {content}
    </Link>
  ) : (
    <span aria-disabled="true">{content}</span>
  );

  if (!collapsed) return item;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function SidebarSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-sm", className)}>{children}</div>;
}

export function Sidebar({
  active,
  collapsed: controlledCollapsed,
  onToggleCollapsed,
}: {
  active?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const toggle = onToggleCollapsed ?? (() => setInternalCollapsed((prev) => !prev));

  const activeLabel = active ?? NAV_ITEMS.find((item) => item.href === pathname)?.label;

  return (
    <nav
      className={cn(
        "flex h-full shrink-0 flex-col gap-sm border-r border-border bg-surface-base p-md transition-[width]",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <SidebarSection className="flex-1">
        {NAV_ITEMS.map((item) => (
          <SidebarItem key={item.label} {...item} active={item.label === activeLabel} collapsed={collapsed} />
        ))}
      </SidebarSection>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        className="flex items-center justify-center rounded-md py-sm text-text-tertiary hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} aria-hidden="true" />
      </button>
    </nav>
  );
}
