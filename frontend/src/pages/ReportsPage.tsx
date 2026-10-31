import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { api } from "../services/api";
import { apiErrorMessage } from "../utils/format";

interface ReportRow {
  userId: string;
  userName: string;
  categoryId: string;
  categoryName: string;
  total: number;
}

interface ReportResponse {
  from: string | null;
  to: string | null;
  totalTickets: number;
  rows: ReportRow[];
}

// yyyy-mm-dd no horário local (é o formato do campo de data e da API).
function toInputDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const dateClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal";

export function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .get<ReportResponse>("/reports/tickets-by-user-category", {
        params: { from: from || undefined, to: to || undefined },
      })
      .then(({ data }) => !cancelled && setReport(data))
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Não foi possível carregar o relatório.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  // Agrupa as linhas (usuário x categoria) por usuário, com o total de cada um.
  const groups = useMemo(() => {
    const map = new Map<string, { userId: string; userName: string; total: number; categories: ReportRow[] }>();
    for (const row of report?.rows ?? []) {
      const group = map.get(row.userId) ?? { userId: row.userId, userName: row.userName, total: 0, categories: [] };
      group.total += row.total;
      group.categories.push(row);
      map.set(row.userId, group);
    }
    return [...map.values()];
  }, [report]);

  function setPreset(days: number | "month" | "all") {
    if (days === "all") {
      setFrom("");
      setTo("");
      return;
    }
    const today = new Date();
    const start = new Date(today);
    if (days === "month") start.setDate(1);
    else start.setDate(today.getDate() - (days - 1));
    setFrom(toInputDate(start));
    setTo(toInputDate(today));
  }

  function exportCsv() {
    if (!report) return;
    const lines = ["Usuário;Categoria;Chamados", ...report.rows.map((r) => `${r.userName};${r.categoryName};${r.total}`)];
    // BOM para o Excel reconhecer os acentos.
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chamados-por-usuario-${toInputDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const presetClass = "rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-base";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Relatórios</h1>
        <p className="text-sm text-muted">Quantos chamados cada usuário abriu, agrupados por categoria.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4 shadow-soft">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">De</label>
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={dateClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Até</label>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={dateClass} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setPreset(7)} className={presetClass}>
            Últimos 7 dias
          </button>
          <button onClick={() => setPreset(30)} className={presetClass}>
            Últimos 30 dias
          </button>
          <button onClick={() => setPreset("month")} className={presetClass}>
            Este mês
          </button>
          <button onClick={() => setPreset("all")} className={presetClass}>
            Todo o período
          </button>
        </div>
        <button
          onClick={exportCsv}
          disabled={!report || report.rows.length === 0}
          className="ml-auto flex items-center gap-2 rounded-md bg-signal px-3 py-2 text-xs font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {error && <p className="rounded-md bg-critical-light px-3 py-2 text-sm text-critical">{error}</p>}

      <div className="rounded-lg border border-line bg-surface shadow-soft">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Carregando relatório...</p>
        ) : !report || report.rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Nenhum chamado encontrado no período.</p>
        ) : (
          <>
            <div className="border-b border-line px-5 py-3 text-sm text-muted">
              <strong className="text-ink">{report.totalTickets}</strong>{" "}
              {report.totalTickets === 1 ? "chamado" : "chamados"} abertos por{" "}
              <strong className="text-ink">{groups.length}</strong> {groups.length === 1 ? "usuário" : "usuários"}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Usuário / Categoria</th>
                    <th className="px-5 py-3 text-right font-medium">Chamados</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <FragmentRows key={g.userId} group={g} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FragmentRows({ group }: { group: { userName: string; total: number; categories: ReportRow[] } }) {
  return (
    <>
      <tr className="border-b border-line bg-base">
        <td className="px-5 py-2.5 font-semibold text-ink">{group.userName}</td>
        <td className="px-5 py-2.5 text-right font-semibold text-ink">{group.total}</td>
      </tr>
      {group.categories.map((c) => (
        <tr key={c.categoryId} className="border-b border-line last:border-0">
          <td className="py-2.5 pl-10 pr-5 text-muted">{c.categoryName}</td>
          <td className="px-5 py-2.5 text-right text-ink">{c.total}</td>
        </tr>
      ))}
    </>
  );
}
