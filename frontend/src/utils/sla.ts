import { TicketStatus } from "../types";

<<<<<<< HEAD
const FINISHED_STATUSES: TicketStatus[] = ["RESOLVIDO", "CANCELADO"];
=======
const FINISHED_STATUSES: TicketStatus[] = ["RESOLVIDO", "ENCERRADO", "CANCELADO"];
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2

export interface SlaInfo {
  deadline: Date;
  overdue: boolean;
  label: string;
}

/**
 * Calcula o prazo do SLA de um chamado a partir da data de abertura e do
 * SLA (em horas) configurado na categoria. Chamados já finalizados não são
 * marcados como atrasados, mesmo que o prazo tenha passado.
 */
export function getSlaInfo(createdAt: string, slaHours: number, status: TicketStatus): SlaInfo {
  const deadline = new Date(new Date(createdAt).getTime() + slaHours * 60 * 60 * 1000);
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
    label: overdue ? `SLA vencido (previsto ${deadlineLabel})` : `SLA até ${deadlineLabel}`,
  };
}
