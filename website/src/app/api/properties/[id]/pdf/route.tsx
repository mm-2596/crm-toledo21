import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getProperty } from "@/lib/api";
import { PropertySheetDocument } from "@/lib/pdf/PropertySheetDocument";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id).catch(() => null);
  if (!property) {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }

  const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toledo21.com";
  const logoPath = path.join(process.cwd(), "public/logo/toledo21-logo.png");
  const logoBuffer = fs.readFileSync(logoPath);
  const logoUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  const buffer = await renderToBuffer(
    <PropertySheetDocument property={property} logoUrl={logoUrl} websiteUrl={websiteUrl} />,
  );

  const filename = `toledo21-${property.reference}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
