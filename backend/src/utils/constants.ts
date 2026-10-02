export const ROLES = ["ADMIN", "TECHNICIAN", "USER"] as const;
export type RoleName = (typeof ROLES)[number];

export const PRIORITIES = ["BAIXA", "MEDIA", "ALTA", "CRITICA"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = [
  "ABERTO",
  "EM_TRIAGEM",
  "EM_ATENDIMENTO",
  "AGUARDANDO_USUARIO",
  "RESOLVIDO",
  "ENCERRADO",
  "CANCELADO",
] as const;
export type TicketStatus = (typeof STATUSES)[number];
