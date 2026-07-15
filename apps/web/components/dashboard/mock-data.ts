import type { LucideIcon } from "lucide-react";
import { FolderKanban, Gamepad2, HardDrive, Rocket, Sparkles, Wallet } from "lucide-react";
import type { ProjectStatus } from "./cards";

// Dados fictícios — sem persistência. Estrutura pensada para ser substituída
// por dados reais (Supabase/API) sem alterar os componentes que os consomem.

export type QuickStat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export const QUICK_STATS: QuickStat[] = [
  { label: "Projects", value: "3", icon: FolderKanban },
  { label: "Games", value: "3", icon: Gamepad2 },
  { label: "Assets", value: "128", icon: HardDrive },
  { label: "AI Tasks", value: "12", icon: Sparkles },
  { label: "Revenue", value: "$4.2k", icon: Wallet },
  { label: "Publishing", value: "1 ativo", icon: Rocket },
];

export type RecentProject = {
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  updatedAt: string;
};

export const RECENT_PROJECTS: RecentProject[] = [
  {
    name: "Project Alpha",
    description: "Puzzle mobile — protótipo em desenvolvimento.",
    status: "Em desenvolvimento",
    progress: 45,
    updatedAt: "há 2 horas",
  },
  {
    name: "Project Beta",
    description: "Runner casual — aguardando revisão de arte.",
    status: "Em revisão",
    progress: 78,
    updatedAt: "ontem",
  },
  {
    name: "Project Gamma",
    description: "Hyper-casual — publicado nas lojas.",
    status: "Publicado",
    progress: 100,
    updatedAt: "há 5 dias",
  },
];

export type ActivityEntry = {
  title: string;
  description: string;
  timestamp: string;
};

export const RECENT_ACTIVITY: ActivityEntry[] = [
  { title: "Build gerado", description: "Project Alpha — build #24", timestamp: "há 20 min" },
  { title: "Asset adicionado", description: "12 sprites importados em Project Beta", timestamp: "há 3 horas" },
  { title: "Publicação atualizada", description: "Project Gamma atingiu 10k downloads", timestamp: "ontem" },
  { title: "Tarefa de IA concluída", description: "Geração de variações de ícone", timestamp: "há 2 dias" },
];

export const AI_INSIGHTS: string[] = [
  "Seus projetos estão progredindo mais rápido que na semana passada.",
  "Duas oportunidades de publicação foram detectadas.",
  "Três atualizações de documentação são recomendadas.",
];

export type RoadmapSnapshot = {
  currentSprint: string;
  completed: number;
  total: number;
  nextSprint: string;
};

export const ROADMAP_SNAPSHOT: RoadmapSnapshot = {
  currentSprint: "Sprint 1 — Application Foundation",
  completed: 6,
  total: 9,
  nextSprint: "Supabase Auth",
};
