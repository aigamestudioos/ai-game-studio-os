import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Reveal } from "./reveal";

type RoadmapStatus = "done" | "in-progress" | "planned";

const ROADMAP: { title: string; description: string; status: RoadmapStatus }[] = [
  { title: "Fundação técnica", description: "Monorepo, Next.js, design system e Playground.", status: "done" },
  { title: "Dashboard visual", description: "Primeira tela real do produto.", status: "in-progress" },
  { title: "Autenticação", description: "Login e controle de acesso via Supabase.", status: "planned" },
  { title: "Projects", description: "Primeiro fluxo de negócio: da ideia ao projeto.", status: "planned" },
  { title: "Games & Publishing", description: "Publicação de jogos nas lojas.", status: "planned" },
];

const STATUS_LABEL: Record<RoadmapStatus, string> = {
  done: "Concluído",
  "in-progress": "Em andamento",
  planned: "Planejado",
};

const STATUS_VARIANT: Record<RoadmapStatus, "success" | "warning" | "outline"> = {
  done: "success",
  "in-progress": "warning",
  planned: "outline",
};

const FAQ_ITEMS = [
  {
    question: "Preciso de uma equipe para usar o AI Game Studio OS?",
    answer:
      "Não. O produto foi desenhado para que um único operador consiga cobrir o ciclo completo — da ideia à operação — com a IA como força de trabalho principal.",
  },
  {
    question: "O AI Game Studio OS substitui minha equipe de marketing?",
    answer:
      "Ele automatiza e orquestra grande parte do trabalho operacional de marketing e publicação, mas decisões estratégicas continuam com você.",
  },
  {
    question: "Funciona para qualquer tipo de jogo mobile?",
    answer: "O foco inicial é hyper-casual e casual, os gêneros mais compatíveis com produção em alto volume.",
  },
  {
    question: "Quando o login e o dashboard funcional ficam disponíveis?",
    answer:
      "A autenticação com Supabase e o primeiro fluxo real de negócio (Projects) estão no roadmap — veja a linha do tempo acima.",
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="px-lg py-24">
      <Reveal className="mx-auto max-w-[48rem]">
        <div className="text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Roadmap</h2>
          <p className="mt-sm text-muted-foreground">Para onde a plataforma está indo.</p>
        </div>

        <ol className="mt-lg space-y-md border-l border-border-subtle pl-lg">
          {ROADMAP.map((item) => (
            <li key={item.title} className="relative">
              <span
                className="absolute -left-[1.65rem] top-1 size-3 rounded-full border-2 border-background bg-primary"
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center gap-sm">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="px-lg py-24">
      <Reveal className="mx-auto max-w-[40rem]">
        <div className="text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Perguntas frequentes</h2>
        </div>

        <Accordion type="single" collapsible className="mt-lg">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
