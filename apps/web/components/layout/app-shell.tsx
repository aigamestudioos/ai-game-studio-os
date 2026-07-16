"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../../hooks/use-auth";
import { Spinner } from "../ui/spinner";
import type { Breadcrumb } from "./topbar";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

// Application Shell — Header + Sidebar + Content (SPEC-005 §9: TopBar → Sidebar →
// Workspace → Content). Reutilizado por Dashboard, Projects, Games, Knowledge,
// Publishing, Marketing, Analytics, Finance e Settings — nenhum desses módulos
// deve recriar header/sidebar próprios.
//
// Rota protegida (mock, Sprint 1.6): redireciona para /login se não houver
// sessão. Vira verificação real de sessão Supabase no Incremento 1.7.
export function AppShell({ breadcrumbs, children }: { breadcrumbs: Breadcrumb[]; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [session, router]);

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
