import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Inbox, Wrench, Clock, CheckCircle2, AlertTriangle, LayoutGrid } from "lucide-react";
import { api } from "../services/api";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { DashboardStats, DashboardCharts, TicketListItem } from "../types";

const statusLabels: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ATENDIMENTO: "Em atendimento",
  AGUARDANDO_USUARIO: "Aguardando usuário",
  RESOLVIDO: "Resolvido",
  CANCELADO: "Cancelado",
};

const priorityColors: Record<string, string> = {
  BAIXA: "#94A3B8",
  MEDIA: "#B5680B",
  ALTA: "#C22B3A",
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [recent, setRecent] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, chartsRes, ticketsRes] = await Promise.all([
          api.get<DashboardStats>("/dashboard/stats"),
          api.get<DashboardCharts>("/dashboard/charts"),
          api.get<TicketListItem[]>("/tickets"),
        ]);
        setStats(statsRes.data);
        setCharts(chartsRes.data);
        setRecent(ticketsRes.data.slice(0, 8));
      } catch {
        setErrorMsg("Não foi possível carregar os dados do dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted">Carregando dashboard...</div>;
  }

  if (errorMsg) {
    return <div className="rounded-md bg-critical-light p-4 text-sm text-critical">{errorMsg}</div>;
  }

  if (!stats || !charts) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-muted">Visão geral dos chamados de suporte técnico.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total de chamados" value={stats.total} description="Todos os chamados registrados" icon={LayoutGrid} />
        <StatCard label="Abertos" value={stats.abertos} description="Aguardando captura por um técnico" icon={Inbox} />
        <StatCard label="Em atendimento" value={stats.emAtendimento} description="Sendo tratados agora" icon={Wrench} />
        <StatCard label="Aguard. usuário" value={stats.aguardandoUsuario} description="Esperando retorno do solicitante" icon={Clock} />
        <StatCard label="Resolvidos" value={stats.resolvidos} description="Solução aplicada" icon={CheckCircle2} tone="success" />
        <StatCard
          label="Alta prioridade"
          value={stats.altaPrioridade}
          description="Chamados com prioridade Alta"
          icon={AlertTriangle}
          tone="critical"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface p-5 shadow-soft lg:col-span-1">
          <h2 className="mb-4 font-display text-sm font-bold text-ink">Chamados por status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.byStatus.map((s) => ({ name: statusLabels[s.status] ?? s.status, total: s.total }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#2F5FED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-line bg-surface p-5 shadow-soft lg:col-span-1">
          <h2 className="mb-4 font-display text-sm font-bold text-ink">Chamados por prioridade</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={charts.byPriority.map((p) => ({ name: p.priority, value: p.total }))}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {charts.byPriority.map((p) => (
                  <Cell key={p.priority} fill={priorityColors[p.priority]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-line bg-surface p-5 shadow-soft lg:col-span-1">
          <h2 className="mb-4 font-display text-sm font-bold text-ink">Chamados por categoria</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.byCategory} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="total" fill="#17915A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface shadow-soft">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-sm font-bold text-ink">Chamados recentes</h2>
        </div>

        {recent.length === 0 ? (
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
                </tr>
              </thead>
              <tbody>
                {recent.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-line last:border-0 hover:bg-base">
                    <td className="px-5 py-3 font-medium text-signal-dark">{ticket.code}</td>
                    <td className="px-5 py-3 font-medium text-ink">{ticket.category.name}</td>
                    <td className="px-5 py-3 text-muted">{ticket.requesterName}</td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-3 text-muted">{ticket.technician?.name ?? "—"}</td>
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
