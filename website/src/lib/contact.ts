// Teléfono general de Toledo21: se usa en la cabecera, el pie, las fichas y el
// botón de WhatsApp. Cambiar aquí cambia el número en toda la web.
export const PHONE_DISPLAY = "673 49 00 94";
export const PHONE_TEL = "+34673490094";
export const WHATSAPP_NUMBER = "34673490094";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
