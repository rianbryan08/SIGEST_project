import { TicketStatus } from "../types";

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  ABERTO: { label: "Aberto", className: "bg-signal-light text-signal-dark" },
<<<<<<< HEAD
  EM_ATENDIMENTO: { label: "Em atendimento", className: "bg-warning-light text-warning" },
  AGUARDANDO_USUARIO: { label: "Aguardando usuário", className: "bg-line text-muted" },
  RESOLVIDO: { label: "Resolvido", className: "bg-success-light text-success" },
=======
  EM_TRIAGEM: { label: "Em triagem", className: "bg-warning-light text-warning" },
  EM_ATENDIMENTO: { label: "Em atendimento", className: "bg-warning-light text-warning" },
  AGUARDANDO_USUARIO: { label: "Aguardando usuário", className: "bg-line text-muted" },
  RESOLVIDO: { label: "Resolvido", className: "bg-success-light text-success" },
  ENCERRADO: { label: "Encerrado", className: "bg-line text-ink" },
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2
  CANCELADO: { label: "Cancelado", className: "bg-critical-light text-critical" },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
