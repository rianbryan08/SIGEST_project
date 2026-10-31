import { ReactNode, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Clock } from "lucide-react";
import { KnowledgeArticle } from "../types";

interface KnowledgeArticleCardProps {
  article: KnowledgeArticle;
  highlight?: string; // ex.: "Parecido com este chamado"
  children?: ReactNode; // ações (aprovar, editar, usar neste chamado...)
}

export function KnowledgeArticleCard({ article, highlight, children }: KnowledgeArticleCardProps) {
  const [open, setOpen] = useState(false);
  const approved = article.status === "APROVADO";
  const usages = article._count.usages;

  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-ink">{article.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-base px-2 py-0.5 text-muted">{article.category.name}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                approved ? "bg-success-light text-success" : "bg-warning-light text-warning"
              }`}
            >
              {approved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              {approved ? "Aprovado" : "Aguardando aprovação"}
            </span>
            <span className="text-muted">
              {usages === 0 ? "Ainda não usado" : `Usado em ${usages} ${usages === 1 ? "chamado" : "chamados"}`}
            </span>
            {highlight && <span className="rounded bg-signal-light px-2 py-0.5 font-medium text-signal-dark">{highlight}</span>}
          </div>
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 flex items-center gap-1 text-xs font-semibold text-signal-dark hover:underline"
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {open ? "Ocultar procedimento" : "Ver procedimento"}
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Problema</p>
            <p className="whitespace-pre-wrap text-ink">{article.problem}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Procedimento / solução</p>
            <p className="whitespace-pre-wrap text-ink">{article.solution}</p>
          </div>
          {article.keywords && (
            <div className="flex flex-wrap gap-1.5">
              {article.keywords
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean)
                .map((k) => (
                  <span key={k} className="rounded bg-base px-2 py-0.5 text-xs text-muted">
                    {k}
                  </span>
                ))}
            </div>
          )}
          <p className="text-xs text-muted">
            Registrado por {article.createdBy.name} em {new Date(article.createdAt).toLocaleDateString("pt-BR")}
            {article.approvedBy && article.approvedAt
              ? ` · aprovado por ${article.approvedBy.name} em ${new Date(article.approvedAt).toLocaleDateString("pt-BR")}`
              : ""}
          </p>
        </div>
      )}
    </div>
  );
}
