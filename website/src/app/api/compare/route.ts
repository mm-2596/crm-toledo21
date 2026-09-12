import { NextResponse } from "next/server";
import { getProperty } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);

  const properties = await Promise.all(
    ids.map((id) =>
      getProperty(id)
        .then((full) => {
          const { similar, ...property } = full;
          void similar;
          return property;
        })
        .catch(() => null),
    ),
  );

  return NextResponse.json({ properties: properties.filter(Boolean) });
}
