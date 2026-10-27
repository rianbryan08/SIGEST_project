<<<<<<< HEAD
export type RoleName = "ADMIN" | "ANALISTA" | "TECHNICIAN" | "USER";
=======
export type RoleName = "ADMIN" | "TECHNICIAN" | "USER";
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2

export type Priority = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export type TicketStatus =
  | "ABERTO"
<<<<<<< HEAD
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "RESOLVIDO"
=======
  | "EM_TRIAGEM"
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "RESOLVIDO"
  | "ENCERRADO"
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2
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
  slaHours: number;
}

export interface TicketListItem {
  id: string;
  code: string;
  title: string;
  priority: Priority;
  status: TicketStatus;
  createdAt: string;
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
<<<<<<< HEAD
=======
  encerrados: number;
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2
  altaPrioridade: number;
}

export interface DashboardCharts {
  byStatus: { status: TicketStatus; total: number }[];
  byPriority: { priority: Priority; total: number }[];
  byCategory: { category: string; total: number }[];
}
