import { FormEvent, useEffect, useState } from "react";
import { UserPlus, KeyRound, X } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { RoleName } from "../types";

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: { name: RoleName };
  department: { name: string } | null;
}

// Hierarquia de criação espelhando a regra do backend:
// ADMIN cria qualquer cargo; ANALISTA só cria TECHNICIAN e USER.
const creatableRolesByRole: Record<string, RoleName[]> = {
  ADMIN: ["ADMIN", "ANALISTA", "TECHNICIAN", "USER"],
  ANALISTA: ["TECHNICIAN", "USER"],
};

// Hierarquia de redefinição de senha espelhando o backend (RESETTABLE_ROLES):
// cada cargo só troca a senha de quem está estritamente abaixo dele.
const resettableRolesByRole: Record<string, RoleName[]> = {
  ADMIN: ["ANALISTA", "TECHNICIAN", "USER"],
  ANALISTA: ["TECHNICIAN", "USER"],
};

const roleLabels: Record<RoleName, string> = {
  ADMIN: "Administrador",
  ANALISTA: "Analista",
  TECHNICIAN: "Técnico",
  USER: "Solicitante",
};

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleName | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allowedRoles = user ? creatableRolesByRole[user.role] ?? [] : [];
  const resettableRoles = user ? resettableRolesByRole[user.role] ?? [] : [];

  const [resetTarget, setResetTarget] = useState<UserListItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<UserListItem[]>("/users");
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!role) {
      setError("Selecione um cargo.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/users", { name, email, password, role });
      setSuccess("Usuário criado com sucesso.");
      setName("");
      setEmail("");
      setPassword("");
      setRole("");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Não foi possível criar o usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError("");
    setResetSaving(true);
    try {
      await api.put(`/users/${resetTarget.id}/password`, { newPassword });
      setResetSuccess(`Senha de ${resetTarget.name} redefinida com sucesso.`);
      setNewPassword("");
      setResetTarget(null);
    } catch (err: any) {
      setResetError(err?.response?.data?.message ?? "Não foi possível redefinir a senha.");
    } finally {
      setResetSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4">
          <h1 className="font-display text-2xl font-bold text-ink">Usuários</h1>
          <p className="text-sm text-muted">Gerencie os usuários do sistema.</p>
        </div>

        {resetSuccess && (
          <p className="mb-4 rounded-md bg-success-light px-3 py-2 text-sm text-success">{resetSuccess}</p>
        )}

        <div className="rounded-lg border border-line bg-surface shadow-soft">
          {loading ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Carregando usuários...</p>
          ) : users.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Não há usuários encontrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Nome</th>
                    <th className="px-5 py-3 font-medium">E-mail</th>
                    <th className="px-5 py-3 font-medium">Cargo</th>
                    <th className="px-5 py-3 font-medium">Departamento</th>
                    <th className="px-5 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-line last:border-0 hover:bg-base">
                      <td className="px-5 py-3 font-medium text-ink">{u.name}</td>
                      <td className="px-5 py-3 text-muted">{u.email}</td>
                      <td className="px-5 py-3 text-muted">{roleLabels[u.role.name]}</td>
                      <td className="px-5 py-3 text-muted">{u.department?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        {resettableRoles.includes(u.role.name) && (
                          <button
                            onClick={() => {
                              setResetTarget(u);
                              setNewPassword("");
                              setResetError("");
                            }}
                            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-base"
                          >
                            <KeyRound size={13} />
                            Redefinir senha
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

      <div>
        <div className="rounded-lg border border-line bg-surface p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-ink">
            <UserPlus size={16} />
            Novo usuário
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Nome</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Cargo</label>
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value as RoleName)}
                className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
              >
                <option value="">Selecione...</option>
                {allowedRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="rounded-md bg-critical-light px-3 py-2 text-sm text-critical">{error}</p>}
            {success && <p className="rounded-md bg-success-light px-3 py-2 text-sm text-success">{success}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-signal py-2.5 text-sm font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
            >
              {saving ? "Criando..." : "Criar usuário"}
            </button>
          </form>
        </div>
      </div>

      {resetTarget && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                <KeyRound size={16} />
                Redefinir senha
              </h2>
              <button
                onClick={() => setResetTarget(null)}
                className="rounded-md p-1 text-muted hover:bg-base"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mb-3 text-sm text-muted">
              Definir uma nova senha de acesso para <strong className="text-ink">{resetTarget.name}</strong> (
              {roleLabels[resetTarget.role.name]}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Nova senha</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
                />
              </div>

              {resetError && <p className="rounded-md bg-critical-light px-3 py-2 text-sm text-critical">{resetError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="flex-1 rounded-md border border-line py-2.5 text-sm font-semibold text-ink hover:bg-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetSaving}
                  className="flex-1 rounded-md bg-signal py-2.5 text-sm font-semibold text-white hover:bg-signal-dark disabled:opacity-60"
                >
                  {resetSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
