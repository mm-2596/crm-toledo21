import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  Kanban,
  LayoutDashboard,
  CheckSquare,
  Users,
  ShieldCheck,
  Megaphone,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { AIAssistant } from "./AIAssistant";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "../auth/AuthContext";

const links = [
  { to: "/", label: "Panel", end: true, icon: LayoutDashboard },
  { to: "/contactos", label: "Contactos", icon: Users },
  { to: "/propiedades", label: "Propiedades", icon: Building2 },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/tareas", label: "Tareas", icon: CheckSquare },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user, logout } = useAuth();
  const visibleLinks =
    user?.role === "ADMIN"
      ? [...links, { to: "/campanas", label: "Campañas", icon: Megaphone }, { to: "/equipo", label: "Equipo", icon: ShieldCheck }]
      : links;

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-[#1c1815]">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col justify-between border-r border-slate-200/70 bg-white/70 px-4 py-6 backdrop-blur-xl">
        <div>
          <div className="mb-8 flex items-center gap-2 px-2">
            <img src="/toledo21-logo-mark.png" alt="Toledo21" className="h-7 w-auto object-contain" />
            <div className="border-l border-slate-200 pl-2">
              <div className="text-xs text-slate-500">Gestión inmobiliaria</div>
            </div>
            <NotificationBell />
          </div>
          <nav className="flex flex-col gap-1">
            {visibleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg border-l-2 px-[10px] py-2 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "border-[#c9a06a] bg-[#1c1815] text-white shadow-sm"
                      : "border-transparent text-slate-600 hover:bg-[#1c1815]/5"
                  }`
                }
              >
                <link.icon size={17} strokeWidth={2} />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <NavLink
            to="/ayuda"
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                isActive ? "bg-[#1c1815] text-white shadow-sm" : "text-slate-500 hover:bg-[#1c1815]/5"
              }`
            }
          >
            <HelpCircle size={17} strokeWidth={2} />
            Guía rápida
          </NavLink>

          {user && (
            <div className="mt-2 flex items-center gap-2 rounded-lg px-1">
              <NavLink
                to="/perfil"
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 hover:bg-[#1c1815]/5"
                title="Editar mi perfil público"
              >
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.name}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-slate-700">{user.name}</div>
                  <div className="truncate text-[11px] text-slate-400">{user.role === "ADMIN" ? "Administrador" : "Agente"}</div>
                </div>
              </NavLink>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-[#1c1815]/5 hover:text-slate-600"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 px-8 py-6">
        {/*
          Sin AnimatePresence/exit: con exit, la pagina saliente y la
          entrante conviven un instante en el flujo normal del documento
          (una debajo de la otra), lo que provocaba un salto de layout
          visible en cada navegacion. Con solo "enter", la saliente se
          desmonta al instante y no hay solape.
        */}
        <motion.div
          key={location.pathname}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
      <AIAssistant />
    </div>
  );
}
