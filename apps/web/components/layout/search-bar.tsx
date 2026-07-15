"use client";

import { Search } from "lucide-react";
import { cn } from "../../lib/utils";

export function SearchBar({ className }: { className?: string }) {
  return (
    <label className={cn("relative hidden max-w-sm flex-1 sm:block", className)}>
      <span className="sr-only">Buscar</span>
      <Search
        className="pointer-events-none absolute left-sm top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder="Buscar em todo o estúdio..."
        className="h-9 w-full rounded-md border border-border-default bg-input pl-8 pr-sm text-sm text-foreground placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
