import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Priority } from "../types";

const priorityConfig: Record<Priority, { label: string; className: string; icon: typeof Minus }> = {
  BAIXA: { label: "Baixa", className: "bg-line text-muted", icon: ArrowDown },
  MEDIA: { label: "Média", className: "bg-warning-light text-warning", icon: Minus },
  ALTA: { label: "Alta", className: "bg-critical-light text-critical", icon: ArrowUp },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      <Icon size={12} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
