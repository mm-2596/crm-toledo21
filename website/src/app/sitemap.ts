import type { MetadataRoute } from "next";
import { getProperties } from "@/lib/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/propiedades`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/equipo`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/oficinas`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/gestoria`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/comparar`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/favoritos`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${siteUrl}/calculadora`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const { properties } = await getProperties({ pageSize: "48" }).catch(() => ({ properties: [] }));

  const propertyRoutes: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${siteUrl}/propiedades/${property.id}`,
    lastModified: property.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...propertyRoutes];
}
