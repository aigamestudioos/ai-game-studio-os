import type { ReactNode } from "react";

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface-base px-lg">
      <span className="text-sm font-semibold">AI Game Studio OS</span>
      {children}
    </header>
  );
}
