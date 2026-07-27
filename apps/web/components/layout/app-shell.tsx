"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useEnsureStudio } from "../../hooks/use-ensure-studio";
import { toast } from "../../hooks/use-toast";
import { Spinner } from "../ui/spinner";
import type { Breadcrumb } from "./topbar";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

// Application Shell — Header + Sidebar + Content (SPEC-005 §9: TopBar → Sidebar →
// Workspace → Content). Reutilizado por Dashboard, Projects, Games, Knowledge,
// Publishing, Marketing, Analytics, Finance e Settings — nenhum desses módulos
// deve recriar header/sidebar próprios.
//
// Rota protegida: sessão real do Supabase Auth (via useAuth/onAuthStateChange).
// O middleware (apps/web/middleware.ts) já bloqueia a navegação no servidor;
// este redirecionamento client-side é a rede de segurança para quando a sessão
// expira/é encerrada enquanto a aba já está aberta (ex.: logout em outra aba,
// token expirado) — sem isso, o usuário ficaria numa tela protegida "morta"
// até a próxima navegação. Nenhuma página individual deve replicar esta checagem.
export function AppShell({ breadcrumbs, children }: { breadcrumbs: Breadcrumb[]; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { session } = useAuth();
  const router = useRouter();
  const { error: studioError } = useEnsureStudio(session);

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [session, router]);

  // Não bloqueia a renderização se o bootstrap do Studio falhar — nenhum
  // módulo de produto ainda depende de public.users/studios (todos seguem
  // 100% mock), então travar a UI aqui seria pior que avisar e deixar
  // continuar. Vira bloqueio de verdade quando um módulo real passar a
  // depender do Studio.
  useEffect(() => {
    if (studioError) {
      toast({ title: "Não foi possível preparar seu Studio", description: studioError, variant: "warning" });
    }
  }, [studioError]);

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar breadcrumbs={breadcrumbs} onMenuClick={() => setMobileNavOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden h-full md:flex">
          <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((prev) => !prev)} />
        </div>

        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute inset-0 bg-backdrop"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative h-full w-56">
              <Sidebar collapsed={false} onToggleCollapsed={() => setMobileNavOpen(false)} />
            </div>
          </div>
        ) : null}

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
