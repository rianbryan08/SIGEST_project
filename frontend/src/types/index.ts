export type RoleName = "ADMIN" | "ANALISTA" | "TECHNICIAN" | "USER";

export type Priority = "BAIXA" | "MEDIA" | "ALTA";

export type TicketStatus =
  | "ABERTO"
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "RESOLVIDO"
  | "CANCELADO";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  department: string | null;
}

export interface Category {
  id: string;
  name: string;
  slaHours: number; // prazo de atendimento, em horas, aplicado aos novos chamados
  defaultPriority: Priority; // prioridade aplicada automaticamente aos novos chamados
  active: boolean;
}

export interface TicketListItem {
  id: string;
  code: string;
  priority: Priority;
  status: TicketStatus;
  createdAt: string;
  dueAt: string;
  requesterName: string;
  category: Category;
  requester: { id: string; name: string };
  technician: { id: string; name: string } | null;
}

export interface TicketFeedback {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  abertos: number;
  emAtendimento: number;
  aguardandoUsuario: number;
  resolvidos: number;
  altaPrioridade: number;
}

export interface DashboardCharts {
  byStatus: { status: TicketStatus; total: number }[];
  byPriority: { priority: Priority; total: number }[];
  byCategory: { category: string; total: number }[];
}

export type KnowledgeStatus = "PENDENTE" | "APROVADO";

export interface KnowledgeArticle {
  id: string;
  title: string;
  problem: string;
  solution: string;
  keywords: string | null;
  status: KnowledgeStatus;
  categoryId: string;
  category: { id: string; name: string };
  createdBy: { id: string; name: string };
  approvedBy: { id: string; name: string } | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { usages: number };
}

export interface KnowledgeSuggestion extends KnowledgeArticle {
  matches: number; // palavras do chamado encontradas no procedimento
  alreadyApplied: boolean; // já registrado como aplicado neste chamado
}
