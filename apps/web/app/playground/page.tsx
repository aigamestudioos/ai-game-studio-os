"use client";

import { Gamepad2, HardDrive, Rocket, Sparkles } from "lucide-react";
import { useState } from "react";
import { ProjectCard, StatCard } from "../../components/dashboard/cards";
import { Sidebar } from "../../components/layout/sidebar";
import { TopBar } from "../../components/layout/topbar";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Modal,
  ModalAction,
  ModalCancel,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import { Progress } from "../../components/ui/progress";
import { Separator } from "../../components/ui/separator";
import { Skeleton } from "../../components/ui/skeleton";
import { Spinner } from "../../components/ui/spinner";
import { Textarea } from "../../components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { useTheme } from "../../hooks/use-theme";
import { toast } from "../../hooks/use-toast";

const NAV_SECTIONS = [
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "cards", label: "Cards" },
  { id: "badges", label: "Badges" },
  { id: "avatars", label: "Avatars" },
  { id: "dialogs", label: "Dialogs & Modals" },
  { id: "toasts", label: "Toasts" },
  { id: "tooltips", label: "Tooltips" },
  { id: "dropdowns", label: "Dropdown Menu" },
  { id: "alerts", label: "Alerts" },
  { id: "feedback", label: "Feedback" },
  { id: "real-examples", label: "Real Examples" },
] as const;

export default function PlaygroundPage() {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [progress, setProgress] = useState(40);

  return (
    <div className="flex min-h-screen">
      <nav className="sticky top-0 flex h-screen w-48 shrink-0 flex-col gap-sm overflow-y-auto border-r border-border bg-surface-base p-md">
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
            Incremento 0.4b — componentes avançados (Dialog, Modal, Toast, Tooltip, Dropdown Menu, Alert,
            Spinner, Skeleton, Separator, Progress).
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

        <section id="dialogs" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Dialogs &amp; Modals</h2>

          <div className="flex flex-wrap items-center gap-sm">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Abrir Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar projeto</DialogTitle>
                  <DialogDescription>
                    Dialog dispensável — fecha ao clicar fora ou pressionar Esc.
                  </DialogDescription>
                </DialogHeader>
                <Input placeholder="Nome do projeto" />
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Modal>
              <ModalTrigger asChild>
                <Button variant="destructive">Excluir (Modal)</Button>
              </ModalTrigger>
              <ModalContent>
                <ModalHeader>
                  <ModalTitle>Excluir projeto?</ModalTitle>
                  <ModalDescription>
                    Modal (AlertDialog) — não fecha ao clicar fora, exige uma ação explícita. Esta ação não
                    pode ser desfeita.
                  </ModalDescription>
                </ModalHeader>
                <ModalFooter>
                  <ModalCancel asChild>
                    <Button variant="outline">Cancelar</Button>
                  </ModalCancel>
                  <ModalAction asChild>
                    <Button variant="destructive">Excluir</Button>
                  </ModalAction>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </div>
        </section>

        <section id="toasts" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Toasts</h2>

          <div className="flex flex-wrap items-center gap-sm">
            <Button
              variant="outline"
              onClick={() => toast({ title: "Padrão", description: "Uma notificação simples." })}
            >
              Disparar default
            </Button>
            <Button
              variant="success"
              onClick={() => toast({ title: "Sucesso", description: "Projeto salvo.", variant: "success" })}
            >
              Disparar success
            </Button>
            <Button
              variant="warning"
              onClick={() =>
                toast({ title: "Atenção", description: "Revise os campos.", variant: "warning" })
              }
            >
              Disparar warning
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" })
              }
            >
              Disparar destructive
            </Button>
          </div>
        </section>

        <section id="tooltips" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Tooltips</h2>

          <div className="flex flex-wrap items-center gap-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Passe o mouse aqui</Button>
              </TooltipTrigger>
              <TooltipContent>Texto de ajuda contextual</TooltipContent>
            </Tooltip>
          </div>
        </section>

        <section id="dropdowns" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Dropdown Menu</h2>

          <div className="flex flex-wrap items-center gap-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Abrir menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Editar</DropdownMenuItem>
                <DropdownMenuItem>Duplicar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        <section id="alerts" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Alerts</h2>

          <div className="flex max-w-[28rem] flex-col gap-sm">
            <Alert>
              <AlertTitle>Informação</AlertTitle>
              <AlertDescription>Alerta padrão, sem ação necessária.</AlertDescription>
            </Alert>
            <Alert variant="success">
              <AlertTitle>Sucesso</AlertTitle>
              <AlertDescription>Operação concluída.</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>Revise antes de continuar.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>Algo deu errado.</AlertDescription>
            </Alert>
          </div>
        </section>

        <section id="feedback" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Feedback (Spinner, Skeleton, Separator, Progress)</h2>

          <div className="flex flex-wrap items-center gap-md">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>

          <div className="flex max-w-[28rem] flex-col gap-sm">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>

          <Separator />

          <div className="flex max-w-[28rem] flex-col gap-sm">
            <Progress value={progress} />
            <div className="flex gap-sm">
              <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.max(0, p - 20))}>
                -20
              </Button>
              <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.min(100, p + 20))}>
                +20
              </Button>
            </div>
          </div>
        </section>

        <section id="real-examples" className="scroll-mt-lg space-y-md">
          <h2 className="text-lg font-semibold">Real Examples</h2>
          <p className="text-sm text-muted-foreground">
            Os mesmos componentes, em contexto — usados de verdade em <code>/dashboard</code>.
          </p>

          <div className="space-y-sm">
            <h3 className="text-sm font-semibold text-text-secondary">Sidebar + TopBar</h3>
            <div className="flex h-80 max-w-[40rem] flex-col overflow-hidden rounded-lg border border-border">
              <TopBar />
              <div className="flex flex-1 overflow-hidden">
                <Sidebar active="Dashboard" />
                <div className="flex-1 bg-background" />
              </div>
            </div>
          </div>

          <div className="space-y-sm">
            <h3 className="text-sm font-semibold text-text-secondary">Project Card</h3>
            <div className="grid max-w-[40rem] grid-cols-1 gap-md sm:grid-cols-2">
              <ProjectCard
                name="Project Alpha"
                description="Puzzle mobile — protótipo em desenvolvimento."
                status="Em desenvolvimento"
              />
              <ProjectCard
                name="Project Gamma"
                description="Hyper-casual — publicado nas lojas."
                status="Publicado"
              />
            </div>
          </div>

          <div className="space-y-sm">
            <h3 className="text-sm font-semibold text-text-secondary">Stat Card</h3>
            <div className="grid max-w-[40rem] grid-cols-2 gap-md sm:grid-cols-4">
              <StatCard label="Games" value="3" icon={Gamepad2} />
              <StatCard label="Assets" value="128" icon={HardDrive} />
              <StatCard label="AI Credits" value="4.200" icon={Sparkles} />
              <StatCard label="Publishing" value="1 ativo" icon={Rocket} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
