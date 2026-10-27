import { getSlaInfo } from "../utils/sla";
import { TicketStatus } from "../types";

interface SlaBadgeProps {
  createdAt: string;
  slaHours: number;
  status: TicketStatus;
}

export function SlaBadge({ createdAt, slaHours, status }: SlaBadgeProps) {
  const sla = getSlaInfo(createdAt, slaHours, status);

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        sla.overdue ? "bg-critical-light text-critical" : "bg-base text-muted"
      }`}
      title={sla.label}
    >
      {sla.label}
    </span>
  );
}
