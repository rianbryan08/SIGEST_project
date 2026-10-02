import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { SlaBadge } from "../components/SlaBadge";
import { TicketListItem, TicketStatus } from "../types";

const statusFilterOptions: { value: string; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "ABERTO", label: "Aberto" },
  { value: "EM_ATENDIMENTO", label: "Em atendimento" },
  { value: "AGUARDANDO_USUARIO", label: "Aguardando usuário" },
  { value: "RESOLVIDO", label: "Resolvido" },
];

export function TicketQueryPage() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await api.get<TicketListItem[]>("/tickets", {
      params: statusFilter ? { status: statusFilter } : {},
    });
    setTickets(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = tickets.filter(
    (t) =>
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Consultar chamados</h1>
        <p className="text-sm text-muted">Acompanhe o andamento dos chamados que você abriu.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5">
          <Search size={16} className="text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código ou título..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
        >
          {statusFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-line bg-surface shadow-soft">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Carregando chamados...</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Não há chamados encontrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Código</th>
                  <th className="px-5 py-3 font-medium">Título</th>
                  <th className="px-5 py-3 font-medium">Prioridade</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Técnico</th>
                  <th className="px-5 py-3 font-medium">SLA</th>
                  <th className="px-5 py-3 font-medium">Aberto em</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-line last:border-0 hover:bg-base">
                    <td className="px-5 py-3 font-medium text-signal-dark">
                      <Link to={`/chamados/${ticket.id}`}>{ticket.code}</Link>
                    </td>
                    <td className="px-5 py-3">{ticket.title}</td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={ticket.status as TicketStatus} />
                    </td>
                    <td className="px-5 py-3 text-muted">{ticket.technician?.name ?? "Aguardando atribuição"}</td>
                    <td className="px-5 py-3">
                      <SlaBadge
                        createdAt={ticket.createdAt}
                        slaHours={ticket.category.slaHours}
                        status={ticket.status as TicketStatus}
                      />
                    </td>
                    <td className="px-5 py-3 text-muted">{new Date(ticket.createdAt).toLocaleDateString("pt-BR")}</td>
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
