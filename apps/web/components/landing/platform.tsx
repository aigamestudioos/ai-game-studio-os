import {
  BarChart3,
  BookOpen,
  Clock,
  FolderKanban,
  Gamepad2,
  Megaphone,
  Plug,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Reveal } from "./reveal";

const MODULES: { title: string; icon: LucideIcon }[] = [
  { title: "Projects", icon: FolderKanban },
  { title: "Games", icon: Gamepad2 },
  { title: "Knowledge", icon: BookOpen },
  { title: "Publishing", icon: Rocket },
  { title: "Marketing", icon: Megaphone },
  { title: "Analytics", icon: BarChart3 },
  { title: "Finance", icon: Wallet },
  { title: "Integrations", icon: Plug },
];

const BENEFITS: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "Redução de tempo", description: "O que levava semanas passa a levar horas.", icon: Clock },
  { title: "Automação", description: "Tarefas repetitivas saem do seu caminho.", icon: Workflow },
  { title: "IA", description: "Um time de especialistas disponível a qualquer momento.", icon: Sparkles },
  { title: "Escalabilidade", description: "De um jogo a um catálogo inteiro, sem reescrever nada.", icon: TrendingUp },
  { title: "Colaboração", description: "Pronto para crescer além de um único operador.", icon: Users },
];

export function Platform() {
  return (
    <section id="platform" className="px-lg py-24">
      <Reveal className="mx-auto max-w-[64rem]">
        <div className="text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Tudo em uma única plataforma</h2>
          <p className="mt-sm text-muted-foreground">Cada domínio do seu estúdio, num só lugar.</p>
        </div>

        <div className="mt-lg grid grid-cols-2 gap-md sm:grid-cols-4">
          {MODULES.map((module) => (
            <Card key={module.title} className="transition-transform hover:-translate-y-1">
              <CardHeader className="items-center text-center">
                <module.icon className="size-6 text-primary" aria-hidden="true" />
                <CardTitle className="mt-sm text-sm">{module.title}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export function Benefits() {
  return (
    <section id="benefits" className="px-lg py-24">
      <Reveal className="mx-auto max-w-[64rem]">
        <div className="text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Benefícios</h2>
        </div>

        <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-5">
          {BENEFITS.map((benefit) => (
            <Card key={benefit.title}>
              <CardHeader>
                <benefit.icon className="size-5 text-primary" aria-hidden="true" />
                <CardTitle className="mt-sm text-sm">{benefit.title}</CardTitle>
                <CardDescription className="text-xs">{benefit.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
