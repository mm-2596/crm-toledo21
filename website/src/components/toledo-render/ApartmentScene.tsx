'use client';

import { useEffect, useId, useRef, type CSSProperties } from 'react';
import Image from 'next/image';
import apartment from './assets/apartment.webp';
import { mountApartmentScene } from './scene-controller';
import { ROOMS } from './rooms';
import styles from './ApartmentScene.module.css';

export interface ApartmentSceneProps {
  className?: string;
  /** Above the fold: true. Other placements: false. Does not change your Next config. */
  eager?: boolean;
}

function ExpandIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6" /></svg>;
}

/** Isolated visual. No Canvas, camera, fixed height, sticky or global CSS. */
export function ApartmentScene({ className = '', eager = true }: ApartmentSceneProps) {
  const root = useRef<HTMLElement>(null);
  const id = useId();
  const panelId = `${id}-room`;
  const dialogId = `${id}-dialog`;
  const dialogTitleId = `${id}-dialog-title`;

  useEffect(() => {
    const element = root.current;
    if (element) return mountApartmentScene(element);
  }, []);

  return (
    <figure
      ref={root}
      className={`${styles.scene} ${className}`}
      data-t21-scene=""
      data-t21-ready="false"
      data-t21-motion="off"
      data-t21-active="all"
      aria-label="Explora una vivienda ilustrada"
    >
      <div className={styles.topline}>
        <span className={styles.kicker}><span aria-hidden="true" /> EL HOGAR, DESDE OTRA PERSPECTIVA</span>
        <span className={styles.concept}>Render conceptual</span>
      </div>
      <div className={styles.viewport} data-t21-pointer-area="">
        <div className={styles.art} data-t21-art="">
          <div className={styles.floating}>
            <Image
              className={styles.image}
              src={apartment}
              alt="Ilustración de una vivienda abierta vista desde arriba: cocina con isla, salón amueblado, dormitorio, baño y terraza con plantas. No corresponde a un inmueble en venta."
              unoptimized
              loading={eager ? 'eager' : 'lazy'}
              fetchPriority={eager ? 'high' : 'auto'}
              draggable={false}
            />
            {ROOMS.map((room) => (
              <button
                key={room.id}
                type="button"
                className={styles.hotspot}
                style={{ '--t21-x': `${room.x}%`, '--t21-y': `${room.y}%`, '--t21-width': `${room.width}%` } as CSSProperties}
                data-t21-room={room.id}
                data-t21-control=""
                aria-label={`Explorar ${room.label.toLowerCase()}`}
                aria-controls={panelId}
                aria-pressed="false"
                disabled
              >
                <span className={styles.hotspotLabel}>{room.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.roomPicker} role="group" aria-label="Selecciona una estancia">
        {ROOMS.map((room) => (
          <button key={room.id} type="button" data-t21-room={room.id} data-t21-control="" aria-controls={panelId} aria-pressed="false" disabled>
            <span aria-hidden="true">{room.number}</span>{room.label}
          </button>
        ))}
      </div>
      <div className={styles.panel} id={panelId} aria-live="polite" aria-atomic="true">
        <span className={styles.panelNumber} data-t21-number="" aria-hidden="true">21</span>
        <div>
          <p className={styles.panelTitle} data-t21-title="">Imagina tu próximo hogar.</p>
          <p className={styles.panelDescription} data-t21-description="">Toca una estancia para descubrirla. Abre el plano para apreciar los detalles.</p>
        </div>
      </div>
      <div className={styles.controls}>
        <button type="button" className={styles.expand} data-t21-open="" data-t21-control="" aria-haspopup="dialog" aria-controls={dialogId} disabled>
          <ExpandIcon /> Ampliar plano <span aria-hidden="true">↗</span>
        </button>
        <button type="button" className={styles.pause} data-t21-pause="" data-t21-control="" aria-pressed="true" disabled>
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4h2v12H6zm6 0h2v12h-2z" /></svg>
          <span data-t21-pause-label="">Activar movimiento</span>
        </button>
      </div>
      <figcaption className={styles.disclaimer}>Ilustración de ambiente. No es un anuncio ni un plano técnico de un inmueble real.</figcaption>

      <dialog className={styles.dialog} id={dialogId} data-t21-dialog="" aria-labelledby={dialogTitleId}>
        <div className={styles.dialogInner}>
          <div className={styles.dialogHeader}>
            <div><span className={styles.kicker}>EXPLORA CADA RINCÓN</span><h2 id={dialogTitleId} data-t21-dialog-title="">Tu hogar, en detalle.</h2></div>
            <button type="button" className={styles.close} data-t21-close="" data-t21-control="" aria-label="Cerrar plano ampliado" disabled>×</button>
          </div>
          <div className={styles.dialogViewport}>
            <div className={styles.dialogArt} data-t21-dialog-art="" data-t21-zoomed="false">
              <Image src={apartment} className={styles.dialogImage} alt="Vista ampliada de la ilustración conceptual de la vivienda." unoptimized draggable={false} loading="lazy" />
            </div>
          </div>
          <div className={styles.dialogFooter}>
            <div className={styles.dialogPicker} role="group" aria-label="Acercar una estancia">
              <button type="button" data-t21-view="all" aria-pressed="true" data-t21-control="" disabled>Vista completa</button>
              {ROOMS.map((room) => <button key={room.id} type="button" data-t21-view={room.id} aria-pressed="false" data-t21-control="" disabled>{room.label}</button>)}
            </div>
            <p>Render conceptual · Los acercamientos amplían la imagen, no cambian el ángulo de la vivienda.</p>
          </div>
        </div>
      </dialog>
    </figure>
  );
}

export default ApartmentScene;
