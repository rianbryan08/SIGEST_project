import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Category } from "../types";

export function NewTicketPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [equipment, setEquipment] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Category[]>("/categories").then(({ data }) => {
      setCategories(data);
      if (data.length > 0) setCategoryId(data[0].id);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/tickets", {
        title,
        description,
        categoryId,
        location,
        equipment,
        contact,
      });
      navigate(`/chamados/${data.id}`);
    } catch {
      setError("Não foi possível abrir o chamado. Verifique os campos obrigatórios.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Novo chamado</h1>
        <p className="text-sm text-muted">Descreva o problema para que um técnico possa atendê-lo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-line bg-surface p-6 shadow-soft">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Título</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Computador não liga"
            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Descrição detalhada</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explique o que está acontecendo, quando começou e o que já foi tentado."
            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Categoria</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">
            A prioridade de atendimento será classificada pela equipe técnica.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Localização/Setor</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Sede - Bloco A"
              className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Equipamento afetado</label>
            <input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Ex: Notebook Dell"
              className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Contato</label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="E-mail ou ramal"
            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
          />
        </div>

        {error && <p className="rounded-md bg-critical-light px-3 py-2 text-sm text-critical">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-signal py-2.5 text-sm font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
        >
          {loading ? "Abrindo chamado..." : "Abrir chamado"}
        </button>
      </form>
    </div>
  );
}
