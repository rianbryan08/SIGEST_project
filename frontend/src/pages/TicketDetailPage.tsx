import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Send } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { SlaBadge } from "../components/SlaBadge";
import { TicketStatus, Priority, TicketFeedback } from "../types";

interface TicketDetail {
  id: string;
  code: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  location: string | null;
  equipment: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  category: { name: string; slaHours: number };
  requester: { id: string; name: string };
  technician: { id: string; name: string } | null;
  history: { id: string; description: string; createdAt: string; user: { name: string } | null }[];
  comments: {
    id: string;
    content: string;
    isFirstTreatment: boolean;
    createdAt: string;
    user: { id: string; name: string };
  }[];
  feedback: TicketFeedback | null;
}

const statusOptions: TicketStatus[] = [
  "ABERTO",
  "EM_ATENDIMENTO",
  "AGUARDANDO_USUARIO",
  "RESOLVIDO",
  "CANCELADO",
];

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comment, setComment] = useState("");
  const [isFirstTreatment, setIsFirstTreatment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [pendingResolve, setPendingResolve] = useState(false);
  const [resolveComment, setResolveComment] = useState("");
  const [resolving, setResolving] = useState(false);

  async function load() {
    const { data } = await api.get<TicketDetail>(`/tickets/${id}`);
    setTicket(data);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleStatusChange(status: TicketStatus) {
    // Resolver exige registrar a tratativa final antes — ver handleConfirmResolve.
    if (status === "RESOLVIDO") {
      setPendingResolve(true);
      return;
    }
    await api.put(`/tickets/${id}/status`, { status });
    await load();
  }

  async function handleConfirmResolve() {
    if (!resolveComment.trim()) return;
    setResolving(true);
    try {
      // Registra a tratativa final como última mensagem, DEPOIS marca como resolvido
      // (uma vez resolvido, o bate-papo é encerrado e não aceita mais mensagens).
      await api.post(`/tickets/${id}/comments`, { content: resolveComment, isFirstTreatment: false });
      await api.put(`/tickets/${id}/status`, { status: "RESOLVIDO" });
      setPendingResolve(false);
      setResolveComment("");
      await load();
    } finally {
      setResolving(false);
    }
  }

  async function handlePriorityChange(priority: Priority) {
    await api.put(`/tickets/${id}/priority`, { priority });
    await load();
  }

  async function handleAddComment() {
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await api.post(`/tickets/${id}/comments`, { content: comment, isFirstTreatment });
      setComment("");
      setIsFirstTreatment(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitFeedback() {
    if (feedbackRating === 0) {
      setFeedbackError("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }
    setFeedbackError("");
    setSavingFeedback(true);
    try {
      await api.post(`/tickets/${id}/feedback`, { rating: feedbackRating, comment: feedbackComment || undefined });
      await load();
    } catch (err: any) {
      setFeedbackError(err?.response?.data?.message ?? "Não foi possível enviar a avaliação.");
    } finally {
      setSavingFeedback(false);
    }
  }

  if (!ticket) {
    return <div className="flex h-64 items-center justify-center text-muted">Carregando chamado...</div>;
  }

  const canManage =
    user?.role === "ADMIN" ||
    ((user?.role === "TECHNICIAN" || user?.role === "ANALISTA") && ticket.technician?.id === user.id);
  const isRequester = user?.id === ticket.requester.id;
  // Chat: cliente que abriu o chamado + técnico que está atendendo + admin (para acompanhamento).
  const canChat = isRequester || canManage;
  const chatOpen = !["RESOLVIDO", "CANCELADO"].includes(ticket.status);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-lg border border-line bg-surface p-6 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-sm font-bold text-signal-dark">{ticket.code}</span>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <SlaBadge createdAt={ticket.createdAt} slaHours={ticket.category.slaHours} status={ticket.status} />
            </div>
          </div>
          <h1 className="font-display text-xl font-bold text-ink">{ticket.title}</h1>
          <p className="mt-2 text-sm text-muted">{ticket.description}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            <div>
              <p className="text-muted">Solicitante</p>
              <p className="font-medium text-ink">{ticket.requester.name}</p>
            </div>
            <div>
              <p className="text-muted">Técnico responsável</p>
              <p className="font-medium text-ink">{ticket.technician?.name ?? "Não atribuído"}</p>
            </div>
            <div>
              <p className="text-muted">Categoria</p>
              <p className="font-medium text-ink">{ticket.category.name}</p>
            </div>
            <div>
              <p className="text-muted">Localização</p>
              <p className="font-medium text-ink">{ticket.location ?? "—"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6 shadow-soft">
          <h2 className="mb-4 font-display text-sm font-bold text-ink">Histórico do chamado</h2>
          <ol className="space-y-4 border-l border-line pl-4">
            {ticket.history.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-signal" />
                <p className="text-sm text-ink">{event.description}</p>
                <p className="text-xs text-muted">
                  {new Date(event.createdAt).toLocaleString("pt-BR")} {event.user ? `— ${event.user.name}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {ticket.status === "RESOLVIDO" && (
          <div className="rounded-lg border border-line bg-surface p-6 shadow-soft">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">Avaliação do atendimento</h2>

            {ticket.feedback ? (
              <div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={18}
                      className={n <= ticket.feedback!.rating ? "fill-warning text-warning" : "text-line"}
                    />
                  ))}
                </div>
                {ticket.feedback.comment && <p className="mt-2 text-sm text-ink">{ticket.feedback.comment}</p>}
                <p className="mt-1 text-xs text-muted">
                  Avaliado em {new Date(ticket.feedback.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
            ) : user?.id === ticket.requester.id ? (
              <div>
                <p className="mb-2 text-sm text-muted">Como você avalia o atendimento recebido neste chamado?</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setFeedbackRating(n)} aria-label={`Nota ${n}`}>
                      <Star size={22} className={n <= feedbackRating ? "fill-warning text-warning" : "text-line"} />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Comentário opcional sobre o atendimento"
                  className="mt-3 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
                />
                {feedbackError && <p className="mt-2 text-sm text-critical">{feedbackError}</p>}
                <button
                  onClick={handleSubmitFeedback}
                  disabled={savingFeedback}
                  className="mt-3 rounded-md bg-signal px-4 py-2 text-sm font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
                >
                  {savingFeedback ? "Enviando..." : "Enviar avaliação"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted">O solicitante ainda não avaliou este atendimento.</p>
            )}
          </div>
        )}

        {canChat && (
          <div className="rounded-lg border border-line bg-surface p-6 shadow-soft">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">
              Bate-papo {ticket.technician ? `com ${ticket.technician.name}` : "(aguardando técnico assumir o chamado)"}
            </h2>

            <div className="flex max-h-96 flex-col gap-3 overflow-y-auto rounded-md bg-base p-3">
              {ticket.comments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">Nenhuma mensagem ainda. Comece a conversa.</p>
              ) : (
                ticket.comments.map((c) => {
                  const isOwn = c.user.id === user?.id;
                  return (
                    <div key={c.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                          isOwn ? "bg-signal text-white" : "bg-surface text-ink"
                        }`}
                      >
                        {!isOwn && <p className="mb-0.5 text-xs font-semibold opacity-80">{c.user.name}</p>}
                        {c.isFirstTreatment && (
                          <span className="mb-1 inline-block rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                            Primeira tratativa
                          </span>
                        )}
                        <p className="whitespace-pre-wrap">{c.content}</p>
                        <p className={`mt-1 text-[10px] ${isOwn ? "text-white/70" : "text-muted"}`}>
                          {new Date(c.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {chatOpen ? (
              <>
                <div className="mt-3 flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escreva uma mensagem..."
                    className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={saving || !comment.trim()}
                    aria-label="Enviar mensagem"
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-signal text-white hover:bg-signal-dark disabled:opacity-60"
                  >
                    <Send size={16} />
                  </button>
                </div>

                {canManage && (
                  <label className="mt-2 flex items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={isFirstTreatment}
                      onChange={(e) => setIsFirstTreatment(e.target.checked)}
                    />
                    Marcar esta mensagem como primeira tratativa
                  </label>
                )}
              </>
            ) : (
              <p className="mt-3 rounded-md bg-base px-3 py-2 text-center text-xs text-muted">
                Este chamado foi finalizado. O bate-papo está encerrado e não aceita mais mensagens.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {canManage && (
          <div className="rounded-lg border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-3 font-display text-sm font-bold text-ink">Alterar status</h2>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {String(s).replace(/_/g, " ")}
                </option>
              ))}
            </select>

            {pendingResolve && (
              <div className="mt-3 rounded-md border border-line bg-base p-3">
                <p className="mb-2 text-xs font-medium text-ink">
                  Antes de marcar como resolvido, registre a tratativa final (obrigatório). Depois disso o
                  bate-papo deste chamado é encerrado.
                </p>
                <textarea
                  rows={3}
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  placeholder="Descreva o diagnóstico e a solução aplicada..."
                  className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleConfirmResolve}
                    disabled={resolving || !resolveComment.trim()}
                    className="rounded-md bg-signal px-3 py-1.5 text-xs font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
                  >
                    {resolving ? "Salvando..." : "Confirmar e marcar como resolvido"}
                  </button>
                  <button
                    onClick={() => {
                      setPendingResolve(false);
                      setResolveComment("");
                    }}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <h2 className="mb-3 mt-4 font-display text-sm font-bold text-ink">Alterar prioridade</h2>
            <select
              value={ticket.priority}
              onChange={(e) => handlePriorityChange(e.target.value as Priority)}
              className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
            >
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="CRITICA">Crítica</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
