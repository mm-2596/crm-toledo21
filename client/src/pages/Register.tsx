import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AxiosError } from "axios";
import { useAuth } from "../auth/AuthContext";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, inviteCode);
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err instanceof AxiosError && err.response?.data?.error
          ? err.response.data.error
          : "No se pudo crear la cuenta.";
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
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Únete al equipo</h1>
          <p className="text-center text-sm text-slate-500">
            Pide el código de invitación al administrador del CRM.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre completo"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña (mínimo 8 caracteres)"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Código de invitación del equipo"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-slate-800 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
