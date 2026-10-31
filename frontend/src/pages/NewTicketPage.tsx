import { ClipboardEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { PriorityBadge } from "../components/PriorityBadge";
import { apiErrorMessage, formatHours } from "../utils/format";
import { Category } from "../types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // mesmo limite do servidor
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const inputClass =
  "w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal";

export function NewTicketPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [requesterName, setRequesterName] = useState(user?.name ?? "");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [equipment, setEquipment] = useState("");
  const [contact, setContact] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Category[]>("/categories").then(({ data }) => {
      const active = data.filter((c) => c.active);
      setCategories(active);
      if (active.length > 0) setCategoryId(active[0].id);
    });
  }, []);

  // Preview da imagem anexada (libera a memória quando troca ou sai da tela).
  useEffect(() => {
    if (!screenshot) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(screenshot);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshot]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  function attachImage(file: File | undefined | null) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Anexe apenas imagens (PNG, JPG, WEBP ou GIF).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setError("");
    setScreenshot(file);
  }

  // Permite colar o print direto (Ctrl+V) depois de tirar a captura de tela.
  function handlePaste(e: ClipboardEvent<HTMLFormElement>) {
    const image = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (image) {
      e.preventDefault();
      attachImage(image);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("requesterName", requesterName);
      form.append("description", description);
      form.append("categoryId", categoryId);
      if (location) form.append("location", location);
      if (equipment) form.append("equipment", equipment);
      if (contact) form.append("contact", contact);
      if (screenshot) form.append("screenshot", screenshot);

      const { data } = await api.post("/tickets", form);
      navigate(`/chamados/${data.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível abrir o chamado. Verifique os campos obrigatórios."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Novo chamado</h1>
        <p className="text-sm text-muted">Escolha a categoria e descreva o problema para que a equipe possa atendê-lo.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        onPaste={handlePaste}
        className="space-y-4 rounded-lg border border-line bg-surface p-6 shadow-soft"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Nome do solicitante</label>
          <input
            required
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            placeholder="Quem está com o problema"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Categoria</label>
          <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {selectedCategory && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-base px-3 py-2 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                Prioridade: <PriorityBadge priority={selectedCategory.defaultPriority} />
              </span>
              <span>
                Prazo de atendimento: <strong className="text-ink">{formatHours(selectedCategory.slaHours)}</strong>
              </span>
              <span>(definidos automaticamente pela categoria)</span>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Descrição detalhada</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explique o que está acontecendo, quando começou e o que já foi tentado."
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Captura de tela (opcional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              attachImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {screenshot && previewUrl ? (
            <div className="relative inline-block">
              <img src={previewUrl} alt="Prévia da captura de tela" className="max-h-48 rounded-md border border-line" />
              <button
                type="button"
                onClick={() => setScreenshot(null)}
                aria-label="Remover imagem"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line px-3 py-4 text-sm text-muted hover:bg-base"
            >
              <ImagePlus size={18} />
              Anexar print do erro (ou cole com Ctrl+V)
            </button>
          )}
          <p className="mt-1 text-xs text-muted">PNG, JPG, WEBP ou GIF, até 5 MB.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Localização/Setor</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Sede - Bloco A"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Equipamento afetado</label>
            <input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Ex: Notebook Dell"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Contato</label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="E-mail ou ramal"
            className={inputClass}
          />
        </div>

        {error && <p className="rounded-md bg-critical-light px-3 py-2 text-sm text-critical">{error}</p>}

        <button
          type="submit"
          disabled={loading || !categoryId}
          className="w-full rounded-md bg-signal py-2.5 text-sm font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
        >
          {loading ? "Abrindo chamado..." : "Abrir chamado"}
        </button>
      </form>
    </div>
  );
}
