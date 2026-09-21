import type { CSSProperties } from "react";
import type { MotionValue } from "framer-motion";

export type Hero3DProps = {
  /** El mismo MotionValue 0..1 que ya controla el sticky de tu hero. */
  progress: MotionValue<number>;
  /** Clases opcionales. No aplicar absolute/inset-0, scale, rotate ni perspective. */
  className?: string;
  style?: CSSProperties;
  quality?: "auto" | "low" | "high";
  /** No lo desactives salvo que el hero ya ofrezca un control equivalente. */
  showMotionToggle?: boolean;
};
