"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useTheme } from "../../hooks/use-theme";

const NAV_SECTIONS = [
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "cards", label: "Cards" },
  { id: "badges", label: "Badges" },
  { id: "avatars", label: "Avatars" },
] as const;

export default function PlaygroundPage() {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="flex min-h-screen">
      <nav className="sticky top-0 flex h-screen w-48 shrink-0 flex-col gap-sm border-r border-border bg-surface-base p-md">
        <p className="mb-sm text-xs font-semibold uppercase tracking-wide text-text-tertiary">Playground</p>
        {NAV_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-md px-sm py-sm text-sm text-foreground hover:bg-secondary"
          >
            {section.label}
          </a>
        ))}
        <div className="mt-auto">
          <Button variant="outline" size="sm" onClick={toggleTheme} className="w-full">
            Tema: {theme === "dark" ? "escuro" : "claro"}
          </Button>
        </div>
      </nav>

      <main className="flex-1 space-y-lg p-lg">
        <header>
          <h1 className="text-2xl font-semibold">Design System Playground</h1>
          <p className="text-sm text-muted-foreground">
            Incremento 0.4a — fundação (Button, Input, Textarea, Card, Badge, Avatar).
          </p>
        </header>

        <section id="buttons" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Buttons</h2>

          <div className="flex flex-wrap items-center gap-sm">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>

          <div className="flex flex-wrap items-center gap-sm">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>

          <div className="flex flex-wrap items-center gap-sm">
            <Button disabled>Disabled</Button>
            <Button loading={loading} onClick={() => setLoading((prev) => !prev)}>
              {loading ? "Carregando..." : "Alternar loading"}
            </Button>
          </div>
        </section>

        <section id="inputs" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Inputs</h2>

          <div className="flex max-w-[28rem] flex-col gap-sm">
            <Input
              placeholder="Default"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
            />
            <Input placeholder="Success" state="success" defaultValue="Valor válido" />
            <Input placeholder="Warning" state="warning" defaultValue="Atenção aqui" />
            <Input placeholder="Error" state="error" defaultValue="Valor inválido" />
            <Input placeholder="Disabled" disabled />
            <Input placeholder="Loading" loading defaultValue="Carregando..." />
            <Textarea placeholder="Textarea default" />
            <Textarea placeholder="Textarea error" state="error" />
          </div>
        </section>

        <section id="cards" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Cards</h2>

          <div className="flex max-w-[28rem] flex-col gap-md">
            <Card>
              <CardHeader>
                <CardTitle>Card padrão</CardTitle>
                <CardDescription>Descrição curta do card.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Conteúdo demonstrando os tokens de superfície e borda.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Ação</Button>
                <Button size="sm" variant="outline">
                  Cancelar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section id="badges" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Badges</h2>

          <div className="flex flex-wrap items-center gap-sm">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        <section id="avatars" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Avatars</h2>

          <div className="flex flex-wrap items-center gap-sm">
            <Avatar>
              <AvatarImage src="https://avatars.githubusercontent.com/u/1" alt="Usuário de exemplo" />
              <AvatarFallback>AG</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>OS</AvatarFallback>
            </Avatar>
          </div>
        </section>
      </main>
    </div>
  );
}
