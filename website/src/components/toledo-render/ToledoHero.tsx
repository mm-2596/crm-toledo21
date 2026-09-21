import type { ReactNode } from 'react';
import { ApartmentScene } from './ApartmentScene';
import styles from './ToledoHero.module.css';

export interface HeroAction { label: string; href: string; }
export interface ToledoHeroProps {
  /** Pass your existing, verified routes. No made-up destination defaults. */
  primaryAction: HeroAction;
  secondaryAction: HeroAction;
  title?: ReactNode;
  description?: string;
  locationLabel?: string;
  className?: string;
}

/** Optional composition. Does not render a navbar, modify scroll or install fonts. */
export function ToledoHero({
  primaryAction,
  secondaryAction,
  title,
  description = 'Viviendas reales. Personas reales. Tu próxima etapa, con el equipo que te acompaña de verdad.',
  locationLabel = 'GETAFE · MADRID SUR',
  className = '',
}: ToledoHeroProps) {
  return (
    <section className={`${styles.hero} ${className}`} aria-label="Encuentra tu próximo hogar">
      <div className={styles.grid}>
        <div className={styles.copy}>
          <div className={styles.eyebrow}><span aria-hidden="true" />{locationLabel}</div>
          <h1 className={styles.title}>{title ?? <>Encuentra<br /><span>el hogar</span> que<br />encaja contigo.</>}</h1>
          <p className={styles.description}>{description}</p>
          <div className={styles.actions}>
            <a href={primaryAction.href} className={styles.primary}>{primaryAction.label}<span aria-hidden="true">↗</span></a>
            <a href={secondaryAction.href} className={styles.secondary}>{secondaryAction.label}</a>
          </div>
          <div className={styles.editorial}><span aria-hidden="true">01 — 04</span><p>No es solo una vivienda.<br /><strong>Es el lugar donde empieza lo siguiente.</strong></p></div>
        </div>
        <div className={styles.visual}><ApartmentScene /></div>
      </div>
    </section>
  );
}

export default ToledoHero;
