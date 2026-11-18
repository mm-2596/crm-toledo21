import QRCode from "qrcode";

// QR en SVG generado en el servidor (no carga nada del navegador). Fondo blanco y margen para que se lea bien.
export async function QrCode({ url, label, size = 132 }: { url: string; label: string; size?: number }) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1c1815", light: "#ffffff" } });
  return (
    <div
      role="img"
      aria-label={label}
      className="overflow-hidden rounded-xl border border-line bg-white p-1.5 [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
