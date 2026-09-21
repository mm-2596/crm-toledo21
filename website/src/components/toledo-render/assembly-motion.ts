/**
 * Montaje del render por regiones 2D. No contiene geometría 3D.
 * Las coordenadas corresponden SOLO al asset plano-vivienda.webp (1048 × 890).
 * El controlador usa Web Animations API, sin listeners globales ni RAF propio.
 */
export const ASSEMBLY_DURATION_MS = 2800;

export const ASSEMBLY_OUTLINE =
  "M86 260 L291 169 L291 110 L470 32 L555 103 L655 65 L856 209 L847 249 L1009 339 L1005 479 L852 561 L855 606 L457 809 L85 333 Z";

/** Regiones del render: recortes de la imagen, no habitaciones modeladas. */
export const ASSEMBLY_PARTS = [
  {
    id: "cocina",
    points: "86,260 291,169 291,110 470,32 555,103 539,250 402,340 218,438 85,333",
    delay: 440,
    x: -8,
    y: 42,
  },
  {
    id: "dormitorio",
    points: "555,103 655,65 856,209 847,249 729,352 539,250",
    delay: 660,
    x: 7,
    y: 52,
  },
  {
    id: "bano",
    points: "847,249 1009,339 1005,479 852,561 675,477 729,352",
    delay: 870,
    x: 10,
    y: 44,
  },
  {
    id: "salon",
    points: "218,438 402,340 539,250 729,352 675,477 363,604 320,634 85,333",
    delay: 1070,
    x: -5,
    y: 46,
  },
  {
    id: "terraza",
    points: "363,604 675,477 852,561 855,606 457,809 320,634",
    delay: 1290,
    x: 0,
    y: 38,
  },
] as const;

/** Trazos esquemáticos de la silueta y algunas líneas del interior. */
export const BLUEPRINT_PATHS = [
  ASSEMBLY_OUTLINE,
  "M85 333 L457 809 L1005 479 M92 320 L458 778 L1006 449",
  "M86 260 L458 749 L1009 339",
  "M555 103 L539 250 L729 352 L847 249",
  "M539 250 L675 477 L852 561",
  "M218 438 L402 340 L539 250",
  "M363 604 L675 477 M320 634 L363 604",
  "M291 110 L294 173 L385 219 L470 182 L470 32",
  "M556 206 L655 147 L794 230 L694 291 Z",
  "M613 260 L697 216 L765 254 L683 301 Z",
  "M282 287 L371 245 L439 281 L351 327 Z",
  "M294 422 L397 370 L484 413 L383 468 Z",
  "M417 485 L455 466 L480 484 L445 507 Z",
  "M557 592 L601 569 L638 591 L597 616 Z",
] as const;

export type AssemblyController = {
  play: () => void;
  pause: () => void;
  finish: () => void;
  dispose: () => void;
};

export function showAssembled(root: HTMLElement): void {
  root.dataset.assemblyPhase = "complete";
}

export function createAssembly(
  root: HTMLElement,
  options: { durationMs?: number; onComplete: () => void },
): AssemblyController {
  const duration = Number.isFinite(options.durationMs)
    ? Math.min(4500, Math.max(1200, options.durationMs as number))
    : ASSEMBLY_DURATION_MS;
  const timeScale = duration / ASSEMBLY_DURATION_MS;
  const animations: Animation[] = [];
  let disposed = false;
  let complete = false;

  function cancelAnimations() {
    for (const animation of animations) {
      animation.onfinish = null;
      animation.oncancel = null;
      animation.cancel();
    }
  }

  function finish() {
    if (complete || disposed) return;
    complete = true;
    cancelAnimations();
    showAssembled(root);
    options.onComplete();
  }

  const controller: AssemblyController = {
    play() {
      if (complete || disposed) return;
      for (const animation of animations) {
        if (animation.playState !== "finished") animation.play();
      }
    },
    pause() {
      if (complete || disposed) return;
      for (const animation of animations) {
        if (animation.playState !== "finished") animation.pause();
      }
    },
    finish,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimations();
      showAssembled(root);
    },
  };

  if (typeof root.animate !== "function") {
    finish();
    return controller;
  }

  function animate(
    target: Element | null,
    frames: Keyframe[],
    milliseconds: number,
    delay = 0,
    easing = "cubic-bezier(.16,1,.3,1)",
  ) {
    if (!target) throw new Error("Falta una capa del montaje Toledo21.");
    const animation = target.animate(frames, {
      duration: milliseconds * timeScale,
      delay: delay * timeScale,
      easing,
      fill: "both",
    });
    // Toda la secuencia se crea pausada en cero. El componente la inicia
    // cuando es visible y el usuario no ha solicitado pausa.
    animation.pause();
    animation.currentTime = 0;
    animations.push(animation);
    return animation;
  }

  try {
    root.dataset.assemblyPhase = "assembling";

    root.querySelectorAll<SVGPathElement>("[data-assembly-line]").forEach((path, i) => {
      animate(path, [{ strokeDashoffset: "1" }, { strokeDashoffset: "0" }], 720, i * 26);
    });
    animate(root.querySelector("[data-assembly-blueprint]"), [
      { opacity: 0.95 }, { opacity: 0 },
    ], 550, 1730);

    for (const part of ASSEMBLY_PARTS) {
      animate(root.querySelector(`[data-assembly-part="${part.id}"]`), [
        { opacity: 0, transform: `translate(${part.x}px, ${part.y}px)` },
        { opacity: 1, transform: "translate(0px, 0px)" },
      ], 950, part.delay);
    }

    // La imagen completa aparece detrás al final; elimina pequeñas juntas
    // entre recortes y recupera exactamente el render con sus etiquetas.
    animate(root.querySelector("[data-assembly-final]"), [
      { opacity: 0 }, { opacity: 1 },
    ], 480, 2190, "ease-out");
    animate(root.querySelector("[data-assembly-pieces]"), [
      { opacity: 1 }, { opacity: 0 },
    ], 300, 2470, "linear");

    // Filete final de luz: no altera la iluminación real de la imagen.
    animate(root.querySelector("[data-assembly-glow]"), [
      { opacity: 0, offset: 0 },
      { opacity: 0.55, offset: 0.28 },
      { opacity: 0, offset: 1 },
    ], 750, 1940, "ease-in-out");

    const clock = animate(root, [{ opacity: 1 }, { opacity: 1 }], ASSEMBLY_DURATION_MS, 0, "linear");
    clock.onfinish = finish;
  } catch {
    // El fallo de un efecto decorativo nunca deja la vivienda invisible.
    finish();
  }
  return controller;
}
