import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { KnowledgeArticleCard } from "../components/KnowledgeArticleCard";
import { KnowledgeFormModal } from "../components/KnowledgeFormModal";
import { apiErrorMessage } from "../utils/format";
import { Category, KnowledgeArticle } from "../types";

type StatusFilter = "" | "APROVADO" | "PENDENTE";

const selectClass =
  "rounded-md border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal";

export function KnowledgePage() {
  const { user } = useAuth();
  const isApprover = user?.role === "ADMIN" || user?.role === "ANALISTA";

  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    api.get<Category[]>("/categories").then(({ data }) => setCategories(data));
  }, []);

  const load = useCallback(async () => {
    const { data } = await api.get<KnowledgeArticle[]>("/knowledge", {
      params: { q: query || undefined, categoryId: categoryId || undefined, status: status || undefined },
    });
    setArticles(data);
    setLoading(false);
  }, [query, categoryId, status]);

  // Recarrega ao mudar os filtros (com pequena espera enquanto digita a pesquisa).
  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const pendingCount = articles.filter((a) => a.status === "PENDENTE").length;
  const canEdit = (a: KnowledgeArticle) => isApprover || (a.createdBy.id === user?.id && a.status === "PENDENTE");

  async function run(action: () => Promise<unknown>, okText: string) {
    setFeedback(null);
    try {
      await action();
      setFeedback({ type: "ok", text: okText });
      await load();
    } catch (err) {
      setFeedback({ type: "error", text: apiErrorMessage(err, "Não foi possível concluir a ação.") });
    }
  }

  function handleDelete(a: KnowledgeArticle) {
    if (!window.confirm(`Excluir o procedimento "${a.title}"?`)) return;
    run(() => api.delete(`/knowledge/${a.id}`), "Procedimento excluído.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Base de conhecimento</h1>
          <p className="text-sm text-muted">
            Procedimentos e soluções de atendimentos anteriores, organizados por categoria.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-semibold text-white hover:bg-signal-dark"
        >
          <Plus size={16} />
          Novo procedimento
        </button>
      </div>

      {isApprover && pendingCount > 0 && status !== "PENDENTE" && (
        <button
          onClick={() => setStatus("PENDENTE")}
          className="w-full rounded-md bg-warning-light px-3 py-2 text-left text-sm font-medium text-warning"
        >
          {pendingCount} {pendingCount === 1 ? "procedimento aguarda" : "procedimentos aguardam"} aprovação. Clique para
          revisar.
        </button>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5">
          <Search size={16} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por palavra-chave (título, problema, solução)..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={selectClass}>
          <option value="">Todos os status</option>
          <option value="APROVADO">Aprovados</option>
          <option value="PENDENTE">Aguardando aprovação</option>
        </select>
      </div>

      {feedback && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            feedback.type === "ok" ? "bg-success-light text-success" : "bg-critical-light text-critical"
          }`}
        >
          {feedback.text}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-muted">Carregando procedimentos...</p>
      ) : articles.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
          Nenhum procedimento encontrado.
        </p>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <KnowledgeArticleCard key={a.id} article={a}>
              {isApprover && a.status === "PENDENTE" && (
                <button
                  onClick={() => run(() => api.post(`/knowledge/${a.id}/approve`), "Procedimento aprovado.")}
                  className="rounded-md bg-signal px-3 py-1.5 text-xs font-semibold text-white hover:bg-signal-dark"
                >
                  Aprovar
                </button>
              )}
              {isApprover && a.status === "APROVADO" && (
                <button
                  onClick={() => run(() => api.post(`/knowledge/${a.id}/revoke`), "Aprovação revogada.")}
                  className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-base"
                >
                  Revogar aprovação
                </button>
              )}
              {canEdit(a) && (
                <>
                  <button
                    onClick={() => {
                      setEditing(a);
                      setFormOpen(true);
                    }}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-base"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-critical hover:bg-critical-light"
                  >
                    Excluir
                  </button>
                </>
              )}
            </KnowledgeArticleCard>
          ))}
        </div>
      )}

      {formOpen && (
        <KnowledgeFormModal
          categories={categories}
          editingId={editing?.id}
          initial={
            editing
              ? {
                  categoryId: editing.categoryId,
                  title: editing.title,
                  problem: editing.problem,
                  solution: editing.solution,
                  keywords: editing.keywords ?? "",
                }
              : { categoryId: categoryId || undefined }
          }
          publishesDirectly={isApprover}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) => {
            setFormOpen(false);
            setFeedback({
              type: "ok",
              text: editing
                ? "Procedimento atualizado."
                : saved.status === "APROVADO"
                  ? "Procedimento salvo e disponível para reutilização."
                  : "Procedimento enviado para aprovação.",
            });
            load();
          }}
        />
      )}
    </div>
  );
}
