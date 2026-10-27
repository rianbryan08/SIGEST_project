import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone?: "default" | "critical" | "success";
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-signal-light text-signal-dark",
  critical: "bg-critical-light text-critical",
  success: "bg-success-light text-success",
};

export function StatCard({ label, value, description, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">{value}</p>
        </div>
        <div className={`rounded-md p-2 ${toneStyles[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">{description}</p>
    </div>
  );
}
