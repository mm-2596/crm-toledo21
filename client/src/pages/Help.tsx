import { Building2, Kanban, CheckSquare, Users, Sparkles, Bot, Wand2 } from "lucide-react";
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
        <GuideCard
          icon={Sparkles}
          title="Calificador de leads (IA)"
          steps={[
            "En la ficha de un contacto, pulsa \"Cualificar lead con IA\" para lanzar una mini-entrevista guiada: zona, operación, presupuesto, habitaciones y financiación.",
            "Al terminar, el CRM calcula automáticamente una prioridad (alta, media o baja) y la guarda en la ficha.",
            "Si hay propiedades que encajan con lo que busca, aparecerán justo debajo como \"Propiedades recomendadas\" — igual que cuando un asesor le pasa opciones al momento.",
          ]}
        />
        <GuideCard
          icon={Wand2}
          title="Redactor de descripciones (IA)"
          steps={[
            "En la ficha de una propiedad, pulsa \"Generar\" para crear una descripción a partir de sus datos (tipo, zona, m², habitaciones…).",
            "Si ya tienes un texto escrito, pulsa \"Mejorar redacción\" para pulirlo antes de publicarlo.",
            "Revisa siempre el resultado antes de guardarlo o publicarlo en el portal.",
          ]}
        />
        <GuideCard
          icon={Bot}
          title="Asistente IA"
          steps={[
            "El botón flotante de abajo a la derecha abre un asistente al que puedes escribirle instrucciones sencillas.",
            'Consultar: "tareas", "citas de hoy", "buscar Ana", "propiedades en Toledo" o "resumen".',
            'Crear sin cambiar de pantalla: "crear contacto Laura Díaz 622333444" o "nueva tarea Llamar para visita para Ana mañana".',
          ]}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <div className="mb-2 flex items-center gap-2 text-indigo-700">
          <Sparkles size={18} />
          <h2 className="text-sm font-semibold">Sobre las funciones de IA de este CRM</h2>
        </div>
        <p className="text-sm text-indigo-900/80">
          Por ahora, el calificador de leads, el asistente y el redactor de textos funcionan con reglas
          integradas en el propio CRM (sin conectarse a WhatsApp ni a un proveedor de IA externo), así que
          ya puedes usarlos hoy mismo. Cuando la agencia lo decida, se pueden conectar a un modelo de IA
          real y a WhatsApp Business sin cambiar cómo se usan desde aquí. El precio estimado de las
          propiedades se calcula comparando el €/m² de inmuebles similares ya cargados en el CRM — no
          sustituye la tasación de un profesional, pero da un punto de partida rápido.
        </p>
      </div>
    </div>
  );
}
