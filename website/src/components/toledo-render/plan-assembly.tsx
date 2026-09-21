'use client';

import { useId } from 'react';
import Image from 'next/image';
import apartment from './assets/apartment.webp';
import styles from './plan-assembly.module.css';
import { ASSEMBLY_OUTLINE, ASSEMBLY_PARTS, BLUEPRINT_PATHS } from './assembly-motion';

export interface PlanAssemblyProps {
  /** Above the fold: true. Other placements: false. */
  eager?: boolean;
}

/**
 * Solo la marca: el ciclo de vida (play/pause/finish/replay) lo controla
 * scene-controller.ts, igual que el resto de la escena, en vez de props
 * React. Así no convive un componente dirigido por estado con el resto
 * del controlador imperativo.
 */
export function PlanAssembly({ eager = true }: PlanAssemblyProps) {
  // Prefijo único: evita colisiones de clipPath si la escena se repite en la página.
  const id = `t21-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div className={styles.stage} data-t21-assembly="" data-assembly-phase="waiting">
      <Image
        className={styles.finalImage}
        src={apartment}
        alt="Ilustración de una vivienda abierta vista desde arriba: cocina con isla, salón amueblado, dormitorio, baño y terraza. No corresponde a un inmueble en venta."
        data-assembly-final=""
        unoptimized
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        draggable={false}
      />
      <svg className={styles.overlay} viewBox="0 0 1048 890" fill="none" aria-hidden="true" focusable="false">
        <defs>
          {ASSEMBLY_PARTS.map((part) => (
            <clipPath key={part.id} id={`${id}-${part.id}`} clipPathUnits="userSpaceOnUse">
              <polygon points={part.points} />
            </clipPath>
          ))}
        </defs>
        <g className={styles.blueprint} data-assembly-blueprint="">
          {BLUEPRINT_PATHS.map((d, i) => (
            <path key={i} d={d} pathLength={1} strokeDasharray="1" data-assembly-line="" />
          ))}
        </g>
        <g data-assembly-pieces="">
          {ASSEMBLY_PARTS.map((part) => (
            <g key={part.id} className={styles.part} data-assembly-part={part.id}>
              <g clipPath={`url(#${id}-${part.id})`}>
                <image href={apartment.src} x="0" y="0" width="1048" height="890" preserveAspectRatio="none" />
              </g>
            </g>
          ))}
        </g>
        <path d={ASSEMBLY_OUTLINE} className={styles.glow} data-assembly-glow="" />
      </svg>
      <noscript>
        <style>{`.${styles.stage} .${styles.finalImage}{opacity:1!important}.${styles.stage} .${styles.overlay}{display:none!important}`}</style>
      </noscript>
    </div>
  );
}

export default PlanAssembly;
