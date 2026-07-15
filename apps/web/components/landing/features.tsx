import { Cpu, Gauge, Lightbulb, Rocket, ShieldCheck, Sparkles, Target, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Reveal } from "./reveal";

const FLOW_STEPS = [
  { label: "Ideia", icon: Lightbulb },
  { label: "IA", icon: Sparkles },
  { label: "Planejamento", icon: Target },
  { label: "Produção", icon: Cpu },
  { label: "Publicação", icon: Rocket },
  { label: "Resultado", icon: Trophy },
];

const WHY_US: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "IA em cada etapa",
    description: "Da concepção à operação, a IA orquestra o trabalho que antes exigia uma equipe inteira.",
    icon: Sparkles,
  },
  {
    title: "Performance",
    description: "Arquitetura enxuta, pensada para escalar de um jogo a dezenas sem retrabalho.",
    icon: Gauge,
  },
  {
    title: "Confiança",
    description: "Cada decisão técnica é rastreável — arquitetura documentada, decisões registradas.",
    icon: ShieldCheck,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-lg py-24">
      <Reveal className="mx-auto max-w-[64rem] text-center">
        <h2 className="text-3xl font-semibold sm:text-4xl">Como funciona</h2>
        <p className="mt-sm text-muted-foreground">Um fluxo contínuo, do rascunho ao jogo publicado.</p>

        <div className="mt-lg flex flex-wrap items-center justify-center gap-sm">
          {FLOW_STEPS.map((step, index) => (
            <div key={step.label} className="flex items-center gap-sm">
              <div className="flex flex-col items-center gap-sm rounded-lg border border-border bg-card px-lg py-lg">
                <step.icon className="size-6 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              {index < FLOW_STEPS.length - 1 ? (
                <span className="text-text-tertiary" aria-hidden="true">
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export function WhyUs() {
  return (
    <section id="why-us" className="px-lg py-24">
      <Reveal className="mx-auto max-w-[64rem]">
        <div className="text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Por que AI Game Studio OS</h2>
          <p className="mt-sm text-muted-foreground">Construído para quem opera um estúdio sozinho.</p>
        </div>

        <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-3">
          {WHY_US.map((item) => (
            <Card key={item.title} className="transition-transform hover:-translate-y-1">
              <CardHeader>
                <item.icon className="size-6 text-primary" aria-hidden="true" />
                <CardTitle className="mt-sm text-base">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
