import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000" },
      { protocol: "https", hostname: "crmtoledo21.neuraltech.pro" },
      { protocol: "https", hostname: "crm-toledo21-production.up.railway.app" },
    ],
    // localhost:4000 (el CRM en desarrollo local) resuelve a una IP privada;
    // solo relevante en dev, en producción las imágenes vienen del dominio del CRM.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
