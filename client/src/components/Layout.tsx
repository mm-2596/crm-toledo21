import { NavLink, Outlet } from "react-router-dom";
import {
  Building2,
  Kanban,
  LayoutDashboard,
  CheckSquare,
  Users,
  HelpCircle,
} from "lucide-react";

const links = [
  { to: "/", label: "Panel", end: true, icon: LayoutDashboard },
  { to: "/contactos", label: "Contactos", icon: Users },
  { to: "/propiedades", label: "Propiedades", icon: Building2 },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/tareas", label: "Tareas", icon: CheckSquare },
];

export function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-60 shrink-0 flex-col justify-between border-r border-slate-200 bg-white px-4 py-6">
        <div>
          <div className="mb-8 flex items-center gap-2 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              T21
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight text-slate-900">Toledo21 CRM</div>
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
                  `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
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
            `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-100"
            }`
          }
        >
          <HelpCircle size={17} strokeWidth={2} />
          Guía rápida
        </NavLink>
      </aside>
      <main className="flex-1 px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
