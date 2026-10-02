import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, ClipboardList } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { SlaBadge } from "../components/SlaBadge";
import { TicketListItem } from "../types";

type Tab = "fila" | "meus";
interface TechnicianOption {
  id: string;
  name: string;
}

export function TechnicianPanelPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("fila");
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [forwardingId, setForwardingId] = useState<string | null>(null);
  const [forwardTarget, setForwardTarget] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await api.get<TicketListItem[]>("/tickets");
    setTickets(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    api.get<TechnicianOption[]>("/users/technicians").then(({ data }) => setTechnicians(data));
  }, []);

  async function handleAssign(id: string) {
    setAssigningId(id);
    setFeedback("");
    try {
      await api.post(`/tickets/${id}/assign`);
      setFeedback("Chamado assumido com sucesso. Acesse o detalhe para registrar a primeira tratativa.");
      await load();
    } catch (err: any) {
      setFeedback(err?.response?.data?.message ?? "Não foi possível assumir o chamado.");
    } finally {
      setAssigningId(null);
    }
  }

  async function handleForward(id: string) {
    const targetId = forwardTarget[id];
    if (!targetId) return;
    setForwardingId(id);
    setFeedback("");
    try {
      await api.post(`/tickets/${id}/forward`, { technicianId: targetId });
      setFeedback("Chamado encaminhado com sucesso.");
      await load();
    } catch (err: any) {
      setFeedback(err?.response?.data?.message ?? "Não foi possível encaminhar o chamado.");
    } finally {
      setForwardingId(null);
    }
  }

  // Fila disponível: todos os chamados abertos, sem técnico ainda — visível para todos os técnicos.
  const fila = tickets.filter((t) => t.status === "ABERTO" && !t.technician);
  const meus = tickets.filter((t) => t.technician?.id === user?.id);
  const otherTechnicians = technicians.filter((t) => t.id !== user?.id);
  const visible = tab === "fila" ? fila : meus;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Painel do técnico</h1>
        <p className="text-sm text-muted">Capture chamados da fila e gerencie seus atendimentos.</p>
      </div>

      <div className="flex gap-2 border-b border-line">
        <button
          onClick={() => setTab("fila")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
            tab === "fila" ? "border-signal text-signal-dark" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          <Inbox size={16} />
          Fila disponível ({fila.length})
        </button>
        <button
          onClick={() => setTab("meus")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
            tab === "meus" ? "border-signal text-signal-dark" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          <ClipboardList size={16} />
          Meus atendimentos ({meus.length})
        </button>
      </div>

      {feedback && <p className="rounded-md bg-signal-light px-3 py-2 text-sm text-signal-dark">{feedback}</p>}

      <div className="rounded-lg border border-line bg-surface shadow-soft">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Carregando chamados...</p>
        ) : visible.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            {tab === "fila" ? "Não há chamados aguardando captura." : "Você ainda não possui chamados atribuídos."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Código</th>
                  <th className="px-5 py-3 font-medium">Título</th>
                  <th className="px-5 py-3 font-medium">Solicitante</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Prioridade</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">SLA</th>
                  <th className="px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-line last:border-0 hover:bg-base">
                    <td className="px-5 py-3 font-medium text-signal-dark">
                      <Link to={`/chamados/${ticket.id}`}>{ticket.code}</Link>
                    </td>
                    <td className="px-5 py-3">{ticket.title}</td>
                    <td className="px-5 py-3 text-muted">{ticket.requester.name}</td>
                    <td className="px-5 py-3 text-muted">{ticket.category.name}</td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-3">
                      <SlaBadge createdAt={ticket.createdAt} slaHours={ticket.category.slaHours} status={ticket.status} />
                    </td>
                    <td className="px-5 py-3">
                      {tab === "fila" ? (
                        <button
                          onClick={() => handleAssign(ticket.id)}
                          disabled={assigningId === ticket.id}
                          className="rounded-md bg-signal px-3 py-1.5 text-xs font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
                        >
                          {assigningId === ticket.id ? "Assumindo..." : "Assumir chamado"}
                        </button>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/chamados/${ticket.id}`}
                            className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-base"
                          >
                            Registrar tratativa
                          </Link>
                          {["ABERTO", "EM_TRIAGEM", "EM_ATENDIMENTO", "AGUARDANDO_USUARIO"].includes(
                            ticket.status
                          ) &&
                            otherTechnicians.length > 0 && (
                              <div className="flex items-center gap-1">
                                <select
                                  value={forwardTarget[ticket.id] ?? ""}
                                  onChange={(e) =>
                                    setForwardTarget((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                                  }
                                  className="rounded-md border border-line px-2 py-1.5 text-xs outline-none focus:border-signal focus:ring-1 focus:ring-signal"
                                >
                                  <option value="">Encaminhar para...</option>
                                  {otherTechnicians.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleForward(ticket.id)}
                                  disabled={forwardingId === ticket.id || !forwardTarget[ticket.id]}
                                  className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-base disabled:opacity-60"
                                >
                                  {forwardingId === ticket.id ? "Enviando..." : "Encaminhar"}
                                </button>
                              </div>
                            )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
