"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "../../hooks/use-theme";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const NAV_LINKS = [
  { href: "#how-it-works", label: "Como funciona" },
  { href: "#why-us", label: "Por que nós" },
  { href: "#platform", label: "Plataforma" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center justify-between px-lg transition-colors",
        scrolled ? "border-b border-border bg-surface-base/80 backdrop-blur-md" : "border-b border-transparent",
      )}
    >
      <span className="text-sm font-semibold">AI Game Studio OS</span>

      <nav className="hidden items-center gap-lg md:flex">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
            {link.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-sm">
        <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === "dark" ? "☀︎" : "☾"}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </header>
  );
}
