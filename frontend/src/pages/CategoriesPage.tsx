import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { api } from "../services/api";
import { PriorityBadge } from "../components/PriorityBadge";
import { apiErrorMessage, formatHours, priorityLabels } from "../utils/format";
import { Category, Priority } from "../types";

interface FormState {
  id?: string;
  name: string;
  defaultPriority: Priority;
  slaHours: number;
  active: boolean;
}

const emptyForm: FormState = { name: "", defaultPriority: "MEDIA", slaHours: 24, active: true };

const inputClass =
  "w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal";

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<Category[]>("/categories");
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setError("");
    setSuccess("");
    setForm({ ...emptyForm });
  }

  function openEdit(c: Category) {
    setError("");
    setSuccess("");
    setForm({ id: c.id, name: c.name, defaultPriority: c.defaultPriority, slaHours: c.slaHours, active: c.active });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        defaultPriority: form.defaultPriority,
        slaHours: form.slaHours,
        active: form.active,
      };
      if (form.id) {
        await api.put(`/categories/${form.id}`, payload);
        setSuccess("Categoria atualizada. As mudanças valem para os próximos chamados abertos.");
      } else {
        await api.post("/categories", payload);
        setSuccess("Categoria criada com sucesso.");
      }
      setForm(null);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar a categoria."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Categorias</h1>
          <p className="text-sm text-muted">
            Cada categoria define a prioridade padrão e o prazo de atendimento aplicados automaticamente aos chamados.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-semibold text-white hover:bg-signal-dark"
        >
          <Plus size={16} />
          Nova categoria
        </button>
      </div>

      {success && <p className="rounded-md bg-success-light px-3 py-2 text-sm text-success">{success}</p>}

      <div className="rounded-lg border border-line bg-surface shadow-soft">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Carregando categorias...</p>
        ) : categories.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Nenhuma categoria cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Prioridade padrão</th>
                  <th className="px-5 py-3 font-medium">Prazo de atendimento</th>
                  <th className="px-5 py-3 font-medium">Situação</th>
                  <th className="px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-base">
                    <td className="px-5 py-3 font-medium text-ink">{c.name}</td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={c.defaultPriority} />
                    </td>
                    <td className="px-5 py-3 text-muted">{formatHours(c.slaHours)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          c.active ? "bg-success-light text-success" : "bg-line text-muted"
                        }`}
                      >
                        {c.active ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => openEdit(c)}
                        className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-base"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-line bg-surface p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-ink">
                {form.id ? "Editar categoria" : "Nova categoria"}
              </h2>
              <button
                onClick={() => setForm(null)}
                aria-label="Fechar"
                className="rounded-md p-1 text-muted hover:bg-base"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Nome</label>
                <input
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Prioridade padrão</label>
                <select
                  value={form.defaultPriority}
                  onChange={(e) => setForm({ ...form, defaultPriority: e.target.value as Priority })}
                  className={inputClass}
                >
                  {(Object.keys(priorityLabels) as Priority[]).map((p) => (
                    <option key={p} value={p}>
                      {priorityLabels[p]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Prazo de atendimento (em horas)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={720}
                  value={form.slaHours}
                  onChange={(e) => setForm({ ...form, slaHours: Number(e.target.value) })}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-muted">
                  Equivale a {formatHours(form.slaHours || 0)}. Máximo de 720 horas (30 dias).
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Categoria ativa (aparece na abertura de chamados)
              </label>

              <p className="rounded-md bg-base px-3 py-2 text-xs text-muted">
                Alterações valem para os próximos chamados. Chamados já abertos mantêm a prioridade e o prazo que
                receberam na abertura.
              </p>

              {error && <p className="rounded-md bg-critical-light px-3 py-2 text-sm text-critical">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm(null)}
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
      )}
    </div>
  );
}
