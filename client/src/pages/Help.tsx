import { Building2, Kanban, CheckSquare, Users, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function GuideCard({
  icon: Icon,
  title,
  steps,
}: {
  icon: LucideIcon;
  title: string;
  steps: string[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={18} />
        </div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-sm text-slate-600">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

export function Help() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Guía rápida para el equipo</h1>
      <p className="mb-6 text-sm text-slate-500">
        Cómo usar el CRM en el día a día. Si tienes dudas, pregunta al responsable del CRM.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GuideCard
          icon={Users}
          title="Contactos"
          steps={[
            "Cuando llegue un lead nuevo (llamada, web, referido…), créalo en \"Contactos\".",
            "Rellena zona de interés y presupuesto si los conoces: ayuda a encontrar la propiedad ideal más rápido.",
            "Entra en su ficha para anotar llamadas, visitas o tareas pendientes de seguimiento.",
          ]}
        />
        <GuideCard
          icon={Building2}
          title="Propiedades"
          steps={[
            "Da de alta cada inmueble con referencia, ciudad, zona y m² — cuantos más datos, mejor funcionará la valoración automática.",
            "Desde la ficha de la propiedad puedes pulsar \"Estimar precio\" para obtener un precio orientativo basado en inmuebles similares ya cargados.",
            "Actualiza el estado (disponible, reservado, vendido…) para que el resto del equipo sepa si sigue en el mercado.",
          ]}
        />
        <GuideCard
          icon={Kanban}
          title="Pipeline de ventas"
          steps={[
            "Cada oportunidad comercial (un lead interesado en algo concreto) se representa como una tarjeta.",
            "Arrastra la tarjeta entre columnas a medida que avanza: Nuevo lead → Contactado → Visita programada → Negociación → Cerrado.",
            "Así todo el equipo ve de un vistazo en qué punto está cada venta.",
          ]}
        />
        <GuideCard
          icon={CheckSquare}
          title="Tareas"
          steps={[
            "Aquí aparecen todas las llamadas, visitas o seguimientos pendientes con fecha, de todos los contactos.",
            "Márcalas como completadas cuando las hayas hecho para no perder el hilo con ningún cliente.",
          ]}
        />
      </div>

      <div className="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-5">
        <div className="mb-2 flex items-center gap-2 text-indigo-700">
          <Sparkles size={18} />
          <h2 className="text-sm font-semibold">Sobre la valoración automática</h2>
        </div>
        <p className="text-sm text-indigo-900/80">
          El precio estimado se calcula comparando el precio por m² de otras propiedades similares
          (misma ciudad, zona y tipo) ya cargadas en el CRM. Cuantas más propiedades reales tengamos,
          más preciso será el cálculo. No sustituye la tasación de un profesional, pero da un punto de
          partida rápido para orientar al cliente.
        </p>
      </div>
    </div>
  );
}
