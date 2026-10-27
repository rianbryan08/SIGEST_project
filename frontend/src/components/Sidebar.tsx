import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  ListChecks,
  Users,
  Wrench,
  FolderKanban,
  BarChart3,
  Settings,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { RoleName } from "../types";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: RoleName[];
}

const items: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "ANALISTA", "TECHNICIAN"] },
  { to: "/chamados", label: "Chamados", icon: Ticket, roles: ["ADMIN"] },
  { to: "/chamados/novo", label: "Abrir chamado", icon: PlusCircle, roles: ["ADMIN", "ANALISTA", "TECHNICIAN", "USER"] },
  { to: "/consultar-chamados", label: "Consultar chamados", icon: ListChecks, roles: ["USER"] },
  { to: "/painel-tecnico", label: "Painel do técnico", icon: Wrench, roles: ["ANALISTA", "TECHNICIAN"] },
  { to: "/usuarios", label: "Usuários", icon: Users, roles: ["ADMIN", "ANALISTA"] },
  { to: "/tecnicos", label: "Técnicos", icon: Wrench, roles: ["ADMIN"] },
  { to: "/categorias", label: "Categorias", icon: FolderKanban, roles: ["ADMIN"] },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, roles: ["ADMIN"] },
  { to: "/configuracoes", label: "Configurações", icon: Settings, roles: ["ADMIN", "ANALISTA", "TECHNICIAN", "USER"] },
];

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const visibleItems = items.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-navy text-white">
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal font-display text-sm font-bold">
          CC
        </div>
        <span className="font-display text-base font-bold">SIGEST</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-navy-light text-white" : "text-white/70 hover:bg-navy-light hover:text-white"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-xs text-white/40">v1.0 — MVP acadêmico</div>
    </aside>
  );
}
