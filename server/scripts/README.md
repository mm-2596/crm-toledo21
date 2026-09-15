# Importador masivo de propiedades

Para traer de golpe las propiedades que ya tienes publicadas en Idealista (o
cualquier otro sitio) sin rellenar el formulario del CRM una por una.

## 1. Rellena la plantilla

Copia `plantilla-importacion-propiedades.csv`, ábrela en Excel o Google
Sheets, y añade una fila por propiedad (las dos primeras filas son ejemplos,
bórralas o sustitúyelas). Columnas:

| Columna | Qué va | Ejemplo |
|---|---|---|
| `referencia` | Única, obligatoria | `GTF-101` |
| `titulo` | Obligatorio | `Piso luminoso en el centro de Getafe` |
| `tipo` | Piso, Casa, Chalet, Ático, Dúplex, Estudio, Local comercial, Oficina, Garaje, Terreno, Nave industrial, Trastero, Otro | `Piso` |
| `operacion` | Venta o Alquiler | `Venta` |
| `precio` | Obligatorio, admite puntos o comas | `145.000` |
| `ciudad`, `zona`, `direccion` | Texto libre | |
| `habitaciones`, `banos`, `m2_construidos`, `m2_utiles`, `planta`, `ano_construccion`, `plazas_garaje`, `gastos_comunidad` | Números | |
| `ascensor`, `aire_acondicionado`, `terraza`, `balcon`, `jardin`, `piscina`, `trastero`, `amueblado`, `exterior` | Sí / No | |
| `estado` | Nuevo / a estrenar, Buen estado, A reformar, Reformado | |
| `calefaccion` | Sin calefacción, Individual, Central | |
| `certificado_consumo`, `certificado_emisiones` | A-G, En trámite, Exento | |
| `consumo_kwh`, `emisiones_kg` | Números (admiten decimales con coma) | |
| `descripcion` | Texto libre | |
| `carpeta_fotos` | Nombre de la subcarpeta con sus fotos (ver paso 2) | `GTF-101` |

Deja en blanco lo que no sepas — solo `referencia`, `titulo`, `tipo`,
`operacion` y `precio` son obligatorios.

Guarda el archivo final como **CSV** (Archivo → Descargar/Exportar → Valores
separados por comas).

## 2. Organiza las fotos

Crea una carpeta (p. ej. `fotos/`) con una subcarpeta por propiedad, nombrada
exactamente igual que su columna `carpeta_fotos`:

```
fotos/
  GTF-101/
    01.jpg
    02.jpg
  GTF-102/
    01.jpg
```

Numera los archivos (01, 02...) para que se suban en ese orden — la primera
foto de la carpeta es la que se usa como portada.

## 3. Ejecuta el importador

Desde la carpeta `server/`, con tu propio usuario y contraseña del CRM (no
se guardan en ningún sitio, solo se usan para esta ejecución):

```bash
IMPORT_EMAIL="tu@email.com" IMPORT_PASSWORD="tu-contraseña" \
npm run import:properties -- ruta/a/tu-plantilla.csv ruta/a/fotos
```

Por defecto apunta a `http://localhost:4000` (el CRM en local). Para
importar directamente a producción:

```bash
IMPORT_API_URL="https://crm-toledo21-production.up.railway.app" \
IMPORT_EMAIL="tu@email.com" IMPORT_PASSWORD="tu-contraseña" \
npm run import:properties -- ruta/a/tu-plantilla.csv ruta/a/fotos
```

Al terminar muestra un resumen (creadas, omitidas, errores, fotos). Es
seguro volver a ejecutarlo si algo falla a mitad: las propiedades ya creadas
(misma `referencia`) se detectan y se saltan, no se duplican.
