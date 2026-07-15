import Link from "next/link";
import { Button } from "../ui/button";
import { Reveal } from "./reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-lg pb-24 pt-24 text-center sm:pt-32">
      {/* Grid discreto, orientado a tokens (--border-subtle) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-subtle)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
      />

      {/* Glow central */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -z-10 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[6rem]"
      />

      {/* Partículas discretas */}
      <div aria-hidden="true" className="absolute left-[15%] top-24 -z-10 size-24 rounded-full bg-success/15 blur-2xl" />
      <div aria-hidden="true" className="absolute right-[12%] top-40 -z-10 size-32 rounded-full bg-warning/10 blur-2xl" />

      <Reveal className="mx-auto flex max-w-[48rem] flex-col items-center gap-md">
        <span className="rounded-md border border-border bg-surface-overlay px-sm py-sm text-xs text-text-secondary">
          Sistema Operacional para Estúdios de Jogos Mobile AI-First
        </span>

        <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-6xl">
          Lance dezenas de jogos por ano, com a IA como sua equipe.
        </h1>

        <p className="max-w-[36rem] text-balance text-base text-muted-foreground sm:text-lg">
          Da ideia à publicação, o AI Game Studio OS orquestra desenvolvimento, marketing e operação para
          que um estúdio de uma pessoa só opere como um estúdio inteiro.
        </p>

        <div className="mt-md flex flex-col gap-sm sm:flex-row">
          <Button asChild size="lg">
            <Link href="/dashboard">Começar Agora</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/playground">Explorar Plataforma</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
