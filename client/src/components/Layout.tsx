import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  Kanban,
  LayoutDashboard,
  CheckSquare,
  Users,
  HelpCircle,
} from "lucide-react";
import { AIAssistant } from "./AIAssistant";

const links = [
  { to: "/", label: "Panel", end: true, icon: LayoutDashboard },
  { to: "/contactos", label: "Contactos", icon: Users },
  { to: "/propiedades", label: "Propiedades", icon: Building2 },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/tareas", label: "Tareas", icon: CheckSquare },
];

export function Layout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col justify-between border-r border-slate-200/70 bg-white/70 px-4 py-6 backdrop-blur-xl">
        <div>
          <div className="mb-8 flex items-center gap-2 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold tracking-tight text-white shadow-sm">
              T21
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight tracking-tight text-slate-900">Toledo21 CRM</div>
              <div className="text-xs text-slate-500">Gestión inmobiliaria</div>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    isActive ? "bg-indigo-600/10 text-indigo-700" : "text-slate-600 hover:bg-slate-900/5"
                  }`
                }
              >
                <link.icon size={17} strokeWidth={2} />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <NavLink
          to="/ayuda"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              isActive ? "bg-indigo-600/10 text-indigo-700" : "text-slate-500 hover:bg-slate-900/5"
            }`
          }
        >
          <HelpCircle size={17} strokeWidth={2} />
          Guía rápida
        </NavLink>
      </aside>
      <main className="flex-1 px-8 py-6">
        <AnimatePresence>
          <motion.div
            key={location.pathname}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 1, stiffness: 340, mass: 0.5 }}
            style={{ position: "relative" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <AIAssistant />
    </div>
  );
}
