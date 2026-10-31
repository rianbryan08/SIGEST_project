import { TicketStatus } from "../types";

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  ABERTO: { label: "Aberto", className: "bg-signal-light text-signal-dark" },
  EM_ATENDIMENTO: { label: "Em atendimento", className: "bg-warning-light text-warning" },
  AGUARDANDO_USUARIO: { label: "Aguardando usuário", className: "bg-line text-muted" },
  RESOLVIDO: { label: "Resolvido", className: "bg-success-light text-success" },
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
