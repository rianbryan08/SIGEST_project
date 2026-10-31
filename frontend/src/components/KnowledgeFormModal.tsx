import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { api } from "../services/api";
import { apiErrorMessage } from "../utils/format";
import { KnowledgeArticle } from "../types";

interface MessageHelper {
  id: string;
  author: string;
  content: string;
}

interface KnowledgeFormModalProps {
  categories: { id: string; name: string }[];
  // Presente ao editar; ao registrar a partir de um chamado, vem só com os dados de partida.
  editingId?: string;
  initial?: { categoryId?: string; title?: string; problem?: string; solution?: string; keywords?: string };
  lockCategory?: boolean;
  sourceTicketId?: string;
  // Mensagens do atendimento que a pessoa pode escolher inserir na solução (nada entra sozinho).
  messageHelpers?: MessageHelper[];
  publishesDirectly: boolean; // quem aprova publica direto; o técnico envia para aprovação
  onClose: () => void;
  onSaved: (article: KnowledgeArticle) => void;
}

const inputClass =
  "w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal";

export function KnowledgeFormModal({
  categories,
  editingId,
  initial,
  lockCategory,
  sourceTicketId,
  messageHelpers,
  publishesDirectly,
  onClose,
  onSaved,
}: KnowledgeFormModalProps) {
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [problem, setProblem] = useState(initial?.problem ?? "");
  const [solution, setSolution] = useState(initial?.solution ?? "");
  const [keywords, setKeywords] = useState(initial?.keywords ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function insertMessage(content: string) {
    setSolution((current) => (current.trim() ? `${current.trimEnd()}\n${content}` : content));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { categoryId, title, problem, solution, keywords: keywords || undefined };
      const { data } = editingId
        ? await api.put<KnowledgeArticle>(`/knowledge/${editingId}`, payload)
        : await api.post<KnowledgeArticle>("/knowledge", { ...payload, sourceTicketId });
      onSaved(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar o procedimento."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-ink/40 p-4">
      <div className="my-8 w-full max-w-xl rounded-lg border border-line bg-surface p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">
            {editingId ? "Editar procedimento" : "Registrar procedimento na base de conhecimento"}
          </h2>
          <button onClick={onClose} aria-label="Fechar" className="rounded-md p-1 text-muted hover:bg-base">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Categoria</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={lockCategory}
              className={`${inputClass} disabled:bg-base`}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Título</label>
            <input
              required
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Impressora não imprime / fila travada"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Problema</label>
            <textarea
              required
              rows={3}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Como o problema se apresenta (sintomas, mensagens de erro)"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Procedimento / solução</label>
            <textarea
              required
              rows={6}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Passo a passo que resolveu o problema"
              className={inputClass}
            />

            {messageHelpers && messageHelpers.length > 0 && (
              <details className="mt-2 rounded-md border border-line bg-base p-2">
                <summary className="cursor-pointer text-xs font-semibold text-ink">
                  Inserir trechos do atendimento (opcional)
                </summary>
                <p className="mt-1 text-xs text-muted">
                  Nada é copiado automaticamente: escolha só as mensagens que realmente fazem parte da solução.
                </p>
                <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
                  {messageHelpers.map((m) => (
                    <li key={m.id} className="flex items-start justify-between gap-2 rounded bg-surface p-2 text-xs">
                      <span className="min-w-0">
                        <strong className="text-ink">{m.author}:</strong>{" "}
                        <span className="whitespace-pre-wrap text-muted">{m.content}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => insertMessage(m.content)}
                        className="flex-shrink-0 rounded border border-line px-2 py-1 font-semibold text-signal-dark hover:bg-base"
                      >
                        Inserir
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Palavras-chave (opcional)</label>
            <input
              maxLength={190}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Separe por vírgula. Ex: spooler, fila, impressão"
              className={inputClass}
            />
          </div>

          {!editingId && (
            <p className="rounded-md bg-base px-3 py-2 text-xs text-muted">
              {publishesDirectly
                ? "Como administrador/analista, o procedimento fica disponível para reutilização assim que for salvo."
                : "O procedimento será enviado para aprovação de um analista ou administrador antes de ficar disponível para reutilização."}
            </p>
          )}

          {error && <p className="rounded-md bg-critical-light px-3 py-2 text-sm text-critical">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-line py-2.5 text-sm font-semibold text-ink hover:bg-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-signal py-2.5 text-sm font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
