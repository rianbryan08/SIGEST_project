import { Construction } from "lucide-react";

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface text-center">
      <Construction size={28} className="text-muted" />
      <p className="font-display font-semibold text-ink">{title}</p>
      <p className="max-w-xs text-sm text-muted">Esta seção será implementada na próxima etapa do projeto.</p>
    </div>
  );
}
