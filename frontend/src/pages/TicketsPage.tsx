import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { SlaBadge } from "../components/SlaBadge";
import { TicketListItem } from "../types";

export function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await api.get<TicketListItem[]>("/tickets");
    setTickets(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAssign(id: string) {
    setAssigningId(id);
    setFeedback("");
    try {
      await api.post(`/tickets/${id}/assign`);
      setFeedback("Chamado assumido com sucesso.");
      await load();
    } catch (err: any) {
      setFeedback(err?.response?.data?.message ?? "Não foi possível assumir o chamado.");
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Chamados</h1>
          <p className="text-sm text-muted">Fila de chamados disponíveis e em andamento.</p>
        </div>
        <Link
          to="/chamados/novo"
          className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-white hover:bg-signal-dark"
        >
          Novo chamado
        </Link>
      </div>

      {feedback && <p className="rounded-md bg-signal-light px-3 py-2 text-sm text-signal-dark">{feedback}</p>}

      <div className="rounded-lg border border-line bg-surface shadow-soft">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Carregando chamados...</p>
        ) : tickets.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Não há chamados encontrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Código</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Solicitante</th>
                  <th className="px-5 py-3 font-medium">Prioridade</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Técnico</th>
                  <th className="px-5 py-3 font-medium">SLA</th>
                  <th className="px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-line last:border-0 hover:bg-base">
                    <td className="px-5 py-3 font-medium text-signal-dark">
                      <Link to={`/chamados/${ticket.id}`}>{ticket.code}</Link>
                    </td>
                    <td className="px-5 py-3 font-medium text-ink">{ticket.category.name}</td>
                    <td className="px-5 py-3 text-muted">{ticket.requesterName}</td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-3 text-muted">{ticket.technician?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <SlaBadge dueAt={ticket.dueAt} status={ticket.status} />
                    </td>
                    <td className="px-5 py-3">
                      {!ticket.technician && user?.role === "TECHNICIAN" && (
                        <button
                          onClick={() => handleAssign(ticket.id)}
                          disabled={assigningId === ticket.id}
                          className="rounded-md bg-signal px-3 py-1.5 text-xs font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
                        >
                          {assigningId === ticket.id ? "Assumindo..." : "Assumir chamado"}
                        </button>
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
