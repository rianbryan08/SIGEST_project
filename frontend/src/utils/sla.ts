import { TicketStatus } from "../types";

const FINISHED_STATUSES: TicketStatus[] = ["RESOLVIDO", "CANCELADO"];

export interface SlaInfo {
  deadline: Date;
  overdue: boolean;
  label: string;
}

/**
 * Informa o prazo de atendimento de um chamado a partir do prazo (dueAt) gravado
 * na abertura, calculado com o SLA da categoria naquele momento. Chamados já
 * finalizados não são marcados como atrasados, mesmo que o prazo tenha passado.
 */
export function getSlaInfo(dueAt: string, status: TicketStatus): SlaInfo {
  const deadline = new Date(dueAt);
  const finished = FINISHED_STATUSES.includes(status);
  const overdue = !finished && new Date() > deadline;

  const deadlineLabel = deadline.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    deadline,
    overdue,
    label: overdue ? `Prazo vencido (era ${deadlineLabel})` : `Prazo até ${deadlineLabel}`,
  };
}
