import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AxiosError } from "axios";
import { useAuth } from "../auth/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err instanceof AxiosError && err.response?.data?.error
          ? err.response.data.error
          : "No se pudo iniciar sesión.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.35 }}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur-xl"
      >
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold tracking-tight text-white shadow-sm">
            T21
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Toledo21 CRM</h1>
          <p className="text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          ¿Eres nuevo en el equipo?{" "}
          <Link to="/registro" className="font-medium text-slate-800 hover:underline">
            Crea tu cuenta
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
