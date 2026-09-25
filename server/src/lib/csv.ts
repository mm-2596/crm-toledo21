/**
 * Excel (con configuración regional española) y Brevo leen bien un CSV con
 * ";" y UTF-8 con BOM. Las celdas que empiezan por = + - @ se interpretarían
 * como fórmulas al abrirlas en Excel (inyección de fórmulas), así que se
 * neutralizan con una comilla, salvo los teléfonos tipo "+34 600 000 000".
 */
export function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value).replace(/\r?\n/g, " ").trim();
  const looksLikePhone = /^[+-]?[\d\s().-]+$/.test(text);
  if (/^[=+\-@\t]/.test(text) && !looksLikePhone) text = `'${text}`;
  return /[";]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

