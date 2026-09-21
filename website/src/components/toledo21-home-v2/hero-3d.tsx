"use client";

import dynamic from "next/dynamic";
import { HeroPoster } from "./hero-poster";
import type { Hero3DProps } from "./types";
import styles from "./hero.module.css";

const CanvasClient = dynamic(
  () => import("./hero-canvas").then((module) => module.HeroCanvas),
  { ssr: false, loading: () => <HeroPoster /> },
);

/** Tiene altura propia. NO es el fondo absoluto de todo el hero. */
export function Hero3D({ className, style, ...props }: Hero3DProps) {
  return (
    <div data-toledo21-home-v2 data-camera="orthographic"
      className={[styles.stage, className].filter(Boolean).join(" ")}
      style={style}>
      <CanvasClient {...props} />
    </div>
  );
}
export type { Hero3DProps } from "./types";
export default Hero3D;
