export const ROLES = ["ADMIN", "ANALISTA", "TECHNICIAN", "USER"] as const;
export type RoleName = (typeof ROLES)[number];

// Hierarquia de criação de usuários: cada cargo só pode criar os cargos listados abaixo dele.
// ADMIN pode criar/ver tudo; ANALISTA cria TECHNICIAN e USER; TECHNICIAN não cria ninguém.
export const CREATABLE_ROLES: Record<RoleName, RoleName[]> = {
  ADMIN: ["ADMIN", "ANALISTA", "TECHNICIAN", "USER"],
  ANALISTA: ["TECHNICIAN", "USER"],
  TECHNICIAN: [],
  USER: [],
};

// Hierarquia de redefinição de senha: cada cargo só pode trocar a senha de quem
// está estritamente ABAIXO dele (diferente de CREATABLE_ROLES, aqui o próprio
// cargo não se inclui — ADMIN não redefine senha de outro ADMIN).
export const RESETTABLE_ROLES: Record<RoleName, RoleName[]> = {
  ADMIN: ["ANALISTA", "TECHNICIAN", "USER"],
  ANALISTA: ["TECHNICIAN", "USER"],
  TECHNICIAN: [],
  USER: [],
};

export const PRIORITIES = ["BAIXA", "MEDIA", "ALTA"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = [
  "ABERTO",
  "EM_ATENDIMENTO",
  "AGUARDANDO_USUARIO",
  "RESOLVIDO",
  "CANCELADO",
] as const;
export type TicketStatus = (typeof STATUSES)[number];
