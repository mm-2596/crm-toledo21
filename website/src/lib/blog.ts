export interface BlogBlock {
  type: "p" | "h2" | "ul";
  text?: string;
  items?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO
  readMinutes: number;
  image: string;
  imageAlt: string;
  content: BlogBlock[];
}

// Contenido propio de Toledo21: guías generales sobre compraventa y alquiler.
// Sin cifras fiscales concretas (cambian cada año y por comunidad autónoma) —
// para eso siempre se remite a hablar con un agente o gestoría.
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "guia-gastos-comprar-vivienda",
    title: "Guía de gastos al comprar una vivienda en Getafe",
    excerpt:
      "Más allá del precio del piso hay una lista de gastos que sorprende a muchos compradores primerizos. Repasamos cuáles son y cuándo se pagan.",
    category: "Comprar",
    date: "2026-09-24",
    readMinutes: 6,
    image: "/images/blog/compra-gastos.jpg",
    imageAlt: "Una pareja firma documentos de compraventa en la mesa de un agente inmobiliario",
    content: [
      {
        type: "p",
        text: "Cuando alguien nos pregunta cuánto necesita para comprar una vivienda, la respuesta nunca es solo el precio del piso. Hay un conjunto de gastos asociados a la compra que, si no se planifican, pueden descuadrar el presupuesto en el último momento. Esta es la lista que repasamos con cada cliente antes de hacer una oferta.",
      },
      { type: "h2", text: "Impuestos de la compraventa" },
      {
        type: "p",
        text: "Si compras una vivienda de segunda mano, pagarás el Impuesto de Transmisiones Patrimoniales (ITP), cuyo porcentaje varía según la comunidad autónoma. Si compras obra nueva directamente al promotor, en su lugar se paga IVA más el Impuesto de Actos Jurídicos Documentados (AJD). El porcentaje exacto cambia con cierta frecuencia, así que lo primero que hacemos con cada comprador es confirmar el tipo vigente antes de calcular nada.",
      },
      { type: "h2", text: "Notaría, registro y gestoría" },
      {
        type: "ul",
        items: [
          "Notaría: la escritura de compraventa tiene un coste fijado por arancel público, que depende del precio de la vivienda.",
          "Registro de la Propiedad: inscribir la vivienda a tu nombre también tiene un coste regulado.",
          "Gestoría: encargarse de que todos los trámites y pagos se presenten correctamente suele ahorrar más tiempo (y algún disgusto) del que cuesta.",
        ],
      },
      { type: "h2", text: "Si pides hipoteca" },
      {
        type: "p",
        text: "Desde 2019 la mayoría de gastos de constitución de la hipoteca (notaría, registro, gestoría de la hipoteca y el AJD del préstamo) los asume el banco. Lo que sí sigue corriendo por cuenta del comprador es la tasación de la vivienda, que exige la entidad para conceder el préstamo.",
      },
      { type: "h2", text: "Una regla que nos gusta dar" },
      {
        type: "p",
        text: "Como cálculo orientativo, conviene reservar entre un 10% y un 12% del precio de la vivienda para cubrir todos estos gastos, además de la entrada si pides hipoteca. Cada caso es distinto, así que en la primera visita te damos una cifra concreta según el inmueble y tu situación, no una tabla genérica.",
      },
    ],
  },
  {
    slug: "hipoteca-fija-o-variable",
    title: "Hipoteca fija o variable: ¿cuál conviene?",
    excerpt:
      "No hay una respuesta única: depende de tu situación, de cuánto tiempo piensas quedarte en la vivienda y de cuánto riesgo estás dispuesto a asumir.",
    category: "Financiación",
    date: "2026-08-30",
    readMinutes: 5,
    image: "/images/blog/hipoteca-tipo.jpg",
    imageAlt: "Una pareja habla con un asesor financiero en una mesa de trabajo",
    content: [
      {
        type: "p",
        text: "Es la pregunta que más nos hacen los compradores que necesitan financiación, y la respuesta corta es: depende. No hay una hipoteca mejor en abstracto, hay una que encaja mejor con tu situación concreta.",
      },
      { type: "h2", text: "Hipoteca fija" },
      {
        type: "p",
        text: "Pagas la misma cuota durante toda la vida del préstamo, sin importar lo que haga el mercado. Da tranquilidad y facilita planificar el resto de gastos del hogar, pero suele partir de un tipo de interés algo más alto que una variable en el momento de la firma.",
      },
      { type: "h2", text: "Hipoteca variable" },
      {
        type: "p",
        text: "La cuota se revisa periódicamente (normalmente cada 6 o 12 meses) según la evolución del Euríbor. Puede salir más barata que una fija si los tipos bajan, pero también puede subir, y eso hay que poder asumirlo sin apuros.",
      },
      { type: "h2", text: "Preguntas que nos hacemos con cada cliente" },
      {
        type: "ul",
        items: [
          "¿Cuánto tiempo piensas quedarte en esta vivienda? A más plazo, una fija suele dar más tranquilidad.",
          "¿Tu ingreso es estable o variable? Si ya tienes incertidumbre en tus ingresos, no añadas más incertidumbre en la cuota.",
          "¿Qué margen tienes si la cuota sube un 20-30%? Es la pregunta que hace cualquier banco serio antes de aprobar una variable.",
          "¿Has comparado la TAE, no solo el tipo de interés? La TAE incluye comisiones y gastos, y es lo que de verdad permite comparar ofertas.",
        ],
      },
      {
        type: "p",
        text: "Nuestro servicio de asesoramiento financiero es gratuito: te ayudamos a comparar ofertas de distintas entidades y a entender la letra pequeña antes de firmar nada.",
      },
    ],
  },
  {
    slug: "requisitos-alquilar-piso",
    title: "Qué pide un casero: requisitos para alquilar un piso",
    excerpt:
      "Nómina, aval, fianza… si vas a alquilar por primera vez, esto es lo que normalmente te van a pedir y cómo prepararlo con antelación.",
    category: "Alquilar",
    date: "2026-09-20",
    readMinutes: 4,
    image: "/images/blog/alquiler-llaves.jpg",
    imageAlt: "Un agente entrega las llaves de un piso en alquiler",
    content: [
      {
        type: "p",
        text: "Cuando encuentras el piso de alquiler que te gusta, la parte más frustrante puede ser descubrir sobre la marcha qué documentación te van a pedir. Tenerla lista de antemano te da ventaja frente a otros candidatos.",
      },
      { type: "h2", text: "Lo que suele pedirse siempre" },
      {
        type: "ul",
        items: [
          "Últimas 2-3 nóminas o, si eres autónomo, la última declaración de la renta y el modelo trimestral de IVA.",
          "Contrato de trabajo o certificado de la empresa, para acreditar estabilidad.",
          "DNI o NIE en vigor.",
          "Vida laboral reciente, que se pide en la Seguridad Social en un par de minutos.",
        ],
      },
      { type: "h2", text: "Fianza y garantías adicionales" },
      {
        type: "p",
        text: "La fianza legal suele ser de una mensualidad, pero muchos propietarios piden además un mes o dos de garantía adicional, sobre todo si el inquilino no acredita ingresos suficientes con nómina. Si tus ingresos son ajustados respecto al alquiler, tener un avalista preparado (con su propia documentación) agiliza mucho el proceso.",
      },
      { type: "h2", text: "Un consejo práctico" },
      {
        type: "p",
        text: "Reúne toda la documentación en una carpeta antes de empezar a visitar pisos, no cuando ya has encontrado el que te gusta. En una zona con demanda alta, el candidato que responde en horas con todo listo suele ganar frente al que tarda una semana en reunir papeles.",
      },
    ],
  },
  {
    slug: "documentos-para-vender-tu-piso",
    title: "Qué documentos necesitas para vender tu piso",
    excerpt:
      "Antes de poner el cartel de \"se vende\" conviene tener localizados estos papeles. Adelantarlos evita retrasos justo cuando aparece un comprador.",
    category: "Vender",
    date: "2026-09-05",
    readMinutes: 5,
    image: "/images/blog/vender-documentos.jpg",
    imageAlt: "Un agente inmobiliario acompaña a unos clientes por las escaleras de un edificio",
    content: [
      {
        type: "p",
        text: "Cuando aparece un comprador interesado, todo se acelera. Tener la documentación lista de antemano evita que la operación se retrase o, peor, que el comprador se eche atrás por la espera.",
      },
      { type: "h2", text: "Documentos de la vivienda" },
      {
        type: "ul",
        items: [
          "Escritura de propiedad.",
          "Nota simple actualizada del Registro de la Propiedad (conviene pedirla poco antes de la venta, no meses atrás).",
          "Certificado energético en vigor, obligatorio para publicar el anuncio.",
          "Último recibo del IBI pagado.",
          "Certificado de estar al corriente de pago de la comunidad de propietarios.",
        ],
      },
      { type: "h2", text: "Si la vivienda tiene hipoteca" },
      {
        type: "p",
        text: "Necesitarás un certificado de deuda pendiente emitido por el banco, que indica cuánto queda por pagar para poder cancelar la hipoteca en el momento de la venta. Pedirlo con antelación evita sorpresas de última hora sobre el importe real que recibirás.",
      },
      { type: "h2", text: "Si heredaste el inmueble" },
      {
        type: "p",
        text: "Hace falta acreditar la aceptación de la herencia y que el impuesto de sucesiones esté liquidado antes de poder vender. Si es tu caso, en Toledo21 gestionamos toda esta tramitación sin coste adicional para nuestros clientes.",
      },
      {
        type: "p",
        text: "Nuestro equipo revisa contigo esta lista en la primera visita, para que cuando llegue una oferta ya esté todo preparado.",
      },
    ],
  },
  {
    slug: "certificado-energetico-que-es",
    title: "Certificado energético: qué es y cuándo es obligatorio",
    excerpt:
      "Es uno de los documentos que más dudas genera. Explicamos qué mide, cuándo caduca y qué pasa si intentas vender o alquilar sin él.",
    category: "Trámites",
    date: "2026-06-08",
    readMinutes: 4,
    image: "/images/blog/certificado-energetico.jpg",
    imageAlt: "Un técnico instala paneles solares en el tejado de una vivienda",
    content: [
      {
        type: "p",
        text: "El certificado de eficiencia energética valora cuánta energía consume una vivienda en condiciones normales de uso y le asigna una letra, de la A (más eficiente) a la G (menos eficiente). Es obligatorio para poner una vivienda en venta o en alquiler, y tiene que aparecer en el anuncio.",
      },
      { type: "h2", text: "¿Quién lo hace?" },
      {
        type: "p",
        text: "Un técnico competente (arquitecto, aparejador o ingeniero certificado) visita la vivienda, evalúa aislamiento, instalaciones y carpintería, y emite el certificado, que después se registra en el organismo correspondiente de la comunidad autónoma.",
      },
      { type: "h2", text: "¿Cuánto dura?" },
      {
        type: "p",
        text: "El certificado tiene una validez de 10 años. Si vas a vender o alquilar y el tuyo ha caducado, hay que renovarlo antes de publicar el anuncio.",
      },
      { type: "h2", text: "¿Qué pasa si no lo tienes?" },
      {
        type: "p",
        text: "No poder acreditarlo puede suponer una sanción, y además ningún portal inmobiliario serio publicará el anuncio sin la calificación energética. Por eso es de los primeros trámites que revisamos con cada propietario.",
      },
      {
        type: "p",
        text: "En Toledo21 tramitamos el certificado energético sin coste para quien vende o alquila con nosotros, así que es una gestión menos de la que preocuparte.",
      },
    ],
  },
  {
    slug: "home-staging-vender-mas-rapido",
    title: "Home staging: preparar tu vivienda para venderla antes",
    excerpt:
      "Pequeños cambios, sin obra ni grandes inversiones, que ayudan a que un comprador se imagine viviendo en tu casa desde la primera visita.",
    category: "Vender",
    date: "2026-05-14",
    readMinutes: 5,
    image: "/images/blog/home-staging.jpg",
    imageAlt: "Salón luminoso y ordenado, preparado para una visita de venta",
    content: [
      {
        type: "p",
        text: "El home staging no consiste en reformar, sino en preparar la vivienda para que el máximo número de personas pueda imaginarse viviendo en ella. Cuesta poco y suele marcar la diferencia entre una visita que se queda en \"está bien\" y una que termina en oferta.",
      },
      { type: "h2", text: "Despersonaliza los espacios" },
      {
        type: "p",
        text: "Fotos familiares, colecciones y objetos muy personales dificultan que un comprador se proyecte en la casa. No hace falta vaciarla, pero sí aligerarla.",
      },
      { type: "h2", text: "Ordena y despeja" },
      {
        type: "p",
        text: "Armarios medio vacíos y encimeras despejadas transmiten que la vivienda tiene más espacio del que parece a simple vista. Es, con diferencia, el cambio más barato y más efectivo.",
      },
      { type: "h2", text: "Cuida la luz" },
      {
        type: "p",
        text: "Abre las cortinas, limpia los cristales y, si alguna bombilla lleva tiempo fundida, cámbiala antes de la primera visita. La luz natural es uno de los factores que más valoran los compradores en las fotos y en persona.",
      },
      { type: "h2", text: "Arregla lo pequeño" },
      {
        type: "ul",
        items: [
          "Un grifo que gotea o una puerta que no cierra bien generan dudas sobre el mantenimiento general de la vivienda.",
          "Una mano de pintura en paredes con marcas renueva el aspecto sin apenas coste.",
          "Un olor neutro (nada de ambientadores fuertes) transmite que la casa está cuidada.",
        ],
      },
      {
        type: "p",
        text: "En la valoración gratuita que hacemos antes de publicar un inmueble, te damos recomendaciones concretas y adaptadas a tu vivienda, no una lista genérica.",
      },
    ],
  },
  {
    slug: "que-mirar-antes-de-comprar-en-una-zona-nueva",
    title: "Qué mirar antes de comprar en una zona que no conoces",
    excerpt:
      "El piso puede ser perfecto sobre el papel, pero la zona es la que determina tu día a día. Esto es lo que recomendamos comprobar antes de decidir.",
    category: "Comprar",
    date: "2026-04-02",
    readMinutes: 4,
    image: "/images/blog/zona-fachada.jpg",
    imageAlt: "Fachada de una vivienda mediterránea con luz cálida de atardecer",
    content: [
      {
        type: "p",
        text: "Es fácil enamorarse de un piso y olvidar que vas a vivir también en su calle, su barrio y su trayecto diario. Antes de hacer una oferta en una zona que no conoces bien, conviene comprobar unas cuantas cosas.",
      },
      { type: "h2", text: "Visita a distintas horas" },
      {
        type: "p",
        text: "Una calle tranquila a media mañana puede ser ruidosa a la salida de un colegio, o el aparcamiento puede complicarse por la tarde. Si puedes, pasa por la zona en al menos dos momentos distintos del día antes de decidir.",
      },
      { type: "h2", text: "Comunicaciones y servicios" },
      {
        type: "ul",
        items: [
          "Tiempo real hasta tu trabajo, no solo la distancia en el mapa.",
          "Transporte público: frecuencia real, no solo si \"hay una parada cerca\".",
          "Supermercado, centro de salud y colegios, si los vas a necesitar.",
        ],
      },
      { type: "h2", text: "Planes urbanísticos previstos" },
      {
        type: "p",
        text: "Preguntar en el ayuntamiento o en la comunidad de propietarios si hay obras, ampliaciones o cambios de uso previstos cerca puede ahorrarte una sorpresa a medio plazo, para bien o para mal.",
      },
      { type: "h2", text: "Habla con quien ya vive allí" },
      {
        type: "p",
        text: "Un par de preguntas a un vecino o al portero suelen dar más información real sobre el día a día del edificio y la zona que cualquier ficha inmobiliaria.",
      },
      {
        type: "p",
        text: "Llevamos desde 1997 en Getafe y Madrid sur: si dudas entre zonas, pregúntanos. Conocemos el detalle de cada barrio mejor que cualquier ficha online.",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getSortedPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}
