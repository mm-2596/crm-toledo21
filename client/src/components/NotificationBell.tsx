import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { NotificationsApi } from "../api/endpoints";
import { activityTypeLabels, formatDateTime } from "../lib/format";
import type { NotificationItem, NotificationState } from "../api/types";

const STATE_STYLES: Record<NotificationState, { label: string; className: string }> = {
  overdue: { label: "Vencida", className: "bg-red-50 text-red-700" },
  soon: { label: "Ahora", className: "bg-amber-50 text-amber-700" },
  today: { label: "Hoy", className: "bg-emerald-50 text-emerald-700" },
  upcoming: { label: "Próxima", className: "bg-slate-100 text-slate-500" },
};

const NOTIFIED_KEY = "t21-notified-activities";

function readNotified(): string[] {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: NotificationsApi.list,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Aviso emergente del navegador para lo que está a punto de empezar; cada tarea avisa una sola vez.
  useEffect(() => {
    if (permission !== "granted" || !data) return;
    const notified = readNotified();
    const fresh = data.items.filter((i) => i.state === "soon" && !notified.includes(i.id));
    if (fresh.length === 0) return;
    for (const item of fresh) {
      new Notification(`${activityTypeLabels[item.type] ?? "Aviso"} · ${formatDateTime(item.dueDate, item.hasTime)}`, {
        body: item.contact ? `${item.description} (${item.contact.name})` : item.description,
        tag: item.id,
      });
    }
    try {
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified, ...fresh.map((i) => i.id)].slice(-200)));
    } catch {
      // Sin almacenamiento local, el aviso puede repetirse; no es grave.
    }
  }, [data, permission]);

  async function enableBrowserNotifications() {
    if (typeof Notification === "undefined") return;
    setPermission(await Notification.requestPermission());
  }

  const count = data?.count ?? 0;
  const items = data?.items ?? [];

  return (
    <div ref={rootRef} className="relative ml-auto">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={count > 0 ? `${count} avisos pendientes` : "Avisos"}
        aria-expanded={open}
        className="relative rounded-full p-1.5 text-slate-500 hover:bg-[#1c1815]/5 hover:text-slate-700"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-[#1c1815]">Tus avisos</div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No tienes nada pendiente. 🎉</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {items.map((item: NotificationItem) => (
                <li key={item.id}>
                  <Link
                    to={item.contact ? `/contactos/${item.contact.id}` : "/tareas"}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={`rounded px-1.5 py-0.5 font-medium ${STATE_STYLES[item.state].className}`}>
                        {STATE_STYLES[item.state].label}
                      </span>
                      <span>
                        {activityTypeLabels[item.type]} · {formatDateTime(item.dueDate, item.hasTime)}
                      </span>
                      {item.unassigned && <span className="text-amber-700">Sin asignar</span>}
                    </div>
                    <div className="mt-1 text-sm text-[#2a241f]">{item.description}</div>
                    {item.contact && <div className="text-xs text-slate-500">{item.contact.name}</div>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {permission === "default" && (
            <button
              onClick={enableBrowserNotifications}
              className="w-full border-t border-slate-100 px-4 py-2.5 text-left text-xs font-medium text-[#2a241f] hover:bg-slate-50"
            >
              Activar avisos emergentes del navegador
            </button>
          )}
          {permission === "denied" && (
            <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
              Los avisos del navegador están bloqueados. Puedes permitirlos desde el candado junto a la dirección.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
