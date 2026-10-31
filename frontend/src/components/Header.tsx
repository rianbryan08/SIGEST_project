import { useState } from "react";
import { Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  ANALISTA: "Analista",
  TECHNICIAN: "Técnico",
  USER: "Solicitante",
};

export function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-surface px-6">
      <div className="flex w-full max-w-sm items-center gap-2 rounded-md border border-line bg-base px-3 py-2">
        <Search size={16} className="text-muted" />
        <input
          type="text"
          placeholder="Buscar chamados..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-md p-2 text-muted hover:bg-base" aria-label="Notificações">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-critical" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-base"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-signal-light font-display text-sm font-bold text-signal-dark">
              {user?.name?.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium leading-4">{user?.name}</p>
              <p className="text-xs text-muted">{user ? roleLabels[user.role] : ""}</p>
            </div>
            <ChevronDown size={14} className="text-muted" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-md border border-line bg-surface py-1 shadow-soft">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-critical hover:bg-critical-light"
              >
                <LogOut size={15} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
