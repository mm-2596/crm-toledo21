import type { ReactNode } from "react";
import styles from "./hero.module.css";

/** Inserta aquí los textos y CTA EXISTENTES, no una copia con contenido inventado. */
export function HeroComposition({ children, visual }: { children: ReactNode; visual: ReactNode }) {
  return (
    <div className={styles.composition} data-toledo21-composition>
      <div className={styles.copy} data-toledo21-copy>{children}</div>
      <div className={styles.visual} data-toledo21-visual>{visual}</div>
    </div>
  );
}
