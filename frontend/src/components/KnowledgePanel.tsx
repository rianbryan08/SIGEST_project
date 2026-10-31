import { useCallback, useEffect, useState } from "react";
import { BookOpen, Check, Search } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { KnowledgeArticleCard } from "./KnowledgeArticleCard";
import { KnowledgeFormModal } from "./KnowledgeFormModal";
import { apiErrorMessage } from "../utils/format";
import { KnowledgeArticle, KnowledgeSuggestion } from "../types";

interface AppliedUse {
  id: string;
  createdAt: string;
  article: { id: string; title: string };
  user: { name: string };
}

interface KnowledgePanelProps {
  ticketId: string;
  category: { id: string; name: string };
  applied: AppliedUse[];
  messages: { id: string; author: string; content: string }[];
  problemText: string; // descrição do chamado, usada como ponto de partida (editável) ao registrar
  onChanged: () => void; // recarrega o chamado (histórico e procedimentos aplicados)
}

// Painel exibido ao técnico dentro do chamado: sugere procedimentos já aprovados da mesma
// categoria, permite pesquisar, registrar o que foi aplicado e propor um novo procedimento.
export function KnowledgePanel({ ticketId, category, applied, messages, problemText, onChanged }: KnowledgePanelProps) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<KnowledgeSuggestion[]>([]);
  const [results, setResults] = useState<KnowledgeArticle[] | null>(null);
  const [query, setQuery] = useState("");
  const [allCategories, setAllCategories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const publishesDirectly = user?.role === "ADMIN" || user?.role === "ANALISTA";

  const loadSuggestions = useCallback(async () => {
    try {
      const { data } = await api.get<KnowledgeSuggestion[]>(`/knowledge/suggestions/${ticketId}`);
      setSuggestions(data);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // Pesquisa por palavras-chave (com pequena espera enquanto a pessoa digita).
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await api.get<KnowledgeArticle[]>("/knowledge", {
        params: { q: query, status: "APROVADO", categoryId: allCategories ? undefined : category.id },
      });
      setResults(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, allCategories, category.id]);

  const appliedIds = new Set(applied.map((a) => a.article.id));

  async function handleApply(articleId: string) {
    setApplyingId(articleId);
    setFeedback(null);
    try {
      await api.post(`/knowledge/${articleId}/apply`, { ticketId });
      setFeedback({ type: "ok", text: "Procedimento registrado neste chamado." });
      await loadSuggestions();
      onChanged();
    } catch (err) {
      setFeedback({ type: "error", text: apiErrorMessage(err, "Não foi possível registrar o procedimento.") });
    } finally {
      setApplyingId(null);
    }
  }

  function renderApplyButton(articleId: string) {
    if (appliedIds.has(articleId)) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-success-light px-2.5 py-1.5 text-xs font-semibold text-success">
          <Check size={13} /> Aplicado neste chamado
        </span>
      );
    }
    return (
      <button
        onClick={() => handleApply(articleId)}
        disabled={applyingId === articleId}
        className="rounded-md bg-signal px-3 py-1.5 text-xs font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
      >
        {applyingId === articleId ? "Registrando..." : "Usei este procedimento"}
      </button>
    );
  }

  const list: { article: KnowledgeArticle; highlight?: string }[] =
    results !== null
      ? results.map((article) => ({ article }))
      : suggestions.map((s) => ({
          article: s,
          highlight: s.matches > 0 ? "Parecido com este chamado" : undefined,
        }));

  return (
    <div className="rounded-lg border border-line bg-surface p-6 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
          <BookOpen size={16} />
          Base de conhecimento — {category.name}
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-base"
        >
          Registrar solução na base
        </button>
      </div>

      {applied.length > 0 && (
        <div className="mb-3 rounded-md bg-success-light px-3 py-2 text-xs text-success">
          <p className="font-semibold">Procedimentos aplicados neste chamado:</p>
          <ul className="mt-1 list-disc pl-4">
            {applied.map((a) => (
              <li key={a.id}>
                {a.article.title} <span className="opacity-80">({a.user.name})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-line bg-base px-3 py-2">
          <Search size={15} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar procedimentos por palavra-chave..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={allCategories} onChange={(e) => setAllCategories(e.target.checked)} />
          Todas as categorias
        </label>
      </div>

      {feedback && (
        <p
          className={`mt-3 rounded-md px-3 py-2 text-xs ${
            feedback.type === "ok" ? "bg-success-light text-success" : "bg-critical-light text-critical"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
        {results !== null ? "Resultados da pesquisa" : "Sugeridos para este chamado"}
      </p>

      {loading ? (
        <p className="py-4 text-center text-sm text-muted">Buscando procedimentos...</p>
      ) : list.length === 0 ? (
        <p className="rounded-md bg-base px-3 py-4 text-center text-sm text-muted">
          {results !== null
            ? "Nenhum procedimento aprovado encontrado para essa pesquisa."
            : "Ainda não há procedimentos aprovados nesta categoria. Ao resolver o chamado, registre a solução para ajudar nos próximos."}
        </p>
      ) : (
        <div className="space-y-2">
          {list.map(({ article, highlight }) => (
            <KnowledgeArticleCard key={article.id} article={article} highlight={highlight}>
              {renderApplyButton(article.id)}
            </KnowledgeArticleCard>
          ))}
        </div>
      )}

      {showForm && (
        <KnowledgeFormModal
          categories={[category]}
          lockCategory
          initial={{ categoryId: category.id, problem: problemText }}
          sourceTicketId={ticketId}
          messageHelpers={messages}
          publishesDirectly={publishesDirectly}
          onClose={() => setShowForm(false)}
          onSaved={(article) => {
            setShowForm(false);
            setFeedback({
              type: "ok",
              text:
                article.status === "APROVADO"
                  ? "Procedimento salvo e disponível na base de conhecimento."
                  : "Procedimento enviado para aprovação. Ele ficará disponível para reutilização depois de aprovado.",
            });
            loadSuggestions();
          }}
        />
      )}
    </div>
  );
}
