import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Cake, Check, MessageCircle } from "lucide-react";
import { GreetingsApi } from "../api/endpoints";
import type { BirthdayItem } from "../api/types";

const dayMonth = (month: number, day: number) => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" }).format(new Date(2000, month - 1, day));

function When({ item }: { item: BirthdayItem }) {
  if (item.daysLeft === 0) return <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">Hoy</span>;
  return <span className="text-xs text-slate-500">{item.daysLeft === 1 ? "Mañana" : `En ${item.daysLeft} días`} · {dayMonth(item.month, item.day)}</span>;
}

/** Quién cumple años: el CRM nos lo recuerda y deja la felicitación por WhatsApp lista con un clic. */
export function BirthdaysCard({ days = 7, showEmpty = false }: { days?: number; showEmpty?: boolean }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["birthdays", days], queryFn: () => GreetingsApi.birthdays(days) });
  const year = new Date().getFullYear();
  const sent = useMutation({
    mutationFn: (id: string) => GreetingsApi.markSent(id, `CUMPLEANOS-${year}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["birthdays"] }),
  });

  const items = data?.birthdays ?? [];
  if (!data || (items.length === 0 && !showEmpty)) return null;

  return (
    <section aria-label="Cumpleaños" className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4">
        <Cake size={18} className="text-amber-600" />
        <h2 className="text-base font-medium text-[#1c1815]">
          {items.some((i) => i.daysLeft === 0) ? `Hoy cumple${items.filter((i) => i.daysLeft === 0).length > 1 ? "n" : ""} años ${items.filter((i) => i.daysLeft === 0).map((i) => i.name).join(", ")}` : "Próximos cumpleaños"}
        </h2>
      </div>
      {items.length === 0 ? (
        <p className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500">Nadie cumple años en los próximos {days} días. Anota la fecha de cumpleaños en la ficha de cada cliente.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {items.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
              <div className="min-w-0 flex-1 basis-52">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/contactos/${b.id}`} className="text-sm font-medium text-[#2a241f] hover:underline">{b.name}</Link>
                  <When item={b} />
                </div>
                <p className="text-xs text-slate-500">
                  {b.emailSent
                    ? "Felicitación por email enviada automáticamente"
                    : b.emailConsent
                      ? data.autoEmail ? "Recibirá nuestra felicitación por email" : "Tiene consentimiento (el envío automático está desactivado)"
                      : "Sin consentimiento de email: felicítale tú"}
                </p>
              </div>
              {b.whatsappSent ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-700"><Check size={13} /> WhatsApp enviado</span>
              ) : b.whatsappUrl ? (
                <a
                  href={b.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sent.mutate(b.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <MessageCircle size={13} /> Felicitar por WhatsApp
                </a>
              ) : (
                <span className="text-xs text-slate-400">Sin teléfono válido</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
