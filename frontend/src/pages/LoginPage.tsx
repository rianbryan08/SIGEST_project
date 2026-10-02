import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LifeBuoy } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-signal">
            <LifeBuoy size={22} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-xl font-bold">SIGEST</h1>
            <p className="text-sm text-white/50">Sistema de Gerenciamento de Suporte de TI</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg bg-surface p-6 shadow-soft">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@empresa.com"
              className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-ink">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-line px-3 py-2.5 pr-10 text-sm outline-none focus:border-signal focus:ring-1 focus:ring-signal"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                aria-label="Mostrar senha"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-md bg-critical-light px-3 py-2 text-sm text-critical">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-signal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
