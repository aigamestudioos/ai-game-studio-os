const LINKS = [
  { label: "GitHub", href: "https://github.com/aigamestudioos/ai-game-studio-os" },
  { label: "Documentação", href: "/playground" },
];

export function Footer() {
  return (
    <footer className="border-t border-border px-lg py-lg">
      <div className="mx-auto flex max-w-[64rem] flex-col items-center justify-between gap-sm text-sm text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} AI Game Studio OS</span>
        <nav className="flex gap-lg">
          {LINKS.map((link) => (
            <a key={link.label} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
          <span>v0.5.0</span>
        </nav>
      </div>
    </footer>
  );
}
