import { ROOMS, type RoomId } from './rooms';

/**
 * DOM-only interactions shared with the standalone preview.
 * No window/document access occurs during module evaluation or server rendering.
 * All observers, listeners, animation frames and temporary styles are cleaned up.
 */
export function mountApartmentScene(root: HTMLElement): () => void {
  const lifetime = new AbortController();
  const { signal } = lifetime;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const art = root.querySelector<HTMLElement>('[data-t21-art]');
  const pointerArea = root.querySelector<HTMLElement>('[data-t21-pointer-area]');
  const dialog = root.querySelector<HTMLDialogElement>('[data-t21-dialog]');
  const dialogArt = root.querySelector<HTMLElement>('[data-t21-dialog-art]');
  const openButton = root.querySelector<HTMLButtonElement>('[data-t21-open]');
  const pauseButton = root.querySelector<HTMLButtonElement>('[data-t21-pause]');
  let manualPaused = false;
  let visible = true;
  let frame = 0;
  let selected: RoomId | null = null;
  let previousOverflow: string | null = null;
  let previousPadding: string | null = null;
  let destroyed = false;

  if (!art || !pointerArea || !dialog || !dialogArt || !openButton || !pauseButton) {
    return () => lifetime.abort();
  }

  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-t21-control]'));
  for (const button of buttons) button.disabled = false;
  const dialogSupported = typeof dialog.showModal === 'function';
  openButton.disabled = !dialogSupported;
  root.dataset.t21Ready = 'true';

  const write = (selector: string, value: string) => {
    const element = root.querySelector<HTMLElement>(selector);
    if (element) element.textContent = value;
  };
  const resetPointer = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    art.style.setProperty('--t21-rx', '0deg');
    art.style.setProperty('--t21-ry', '0deg');
    art.style.setProperty('--t21-tx', '0px');
  };
  const canMove = () => !manualPaused && !motionQuery.matches && visible && !document.hidden && !dialog.open;
  const updateMotion = () => {
    root.dataset.t21Motion = canMove() ? 'on' : 'off';
    pauseButton.disabled = motionQuery.matches;
    pauseButton.setAttribute('aria-pressed', String(manualPaused || motionQuery.matches));
    const text = motionQuery.matches ? 'Movimiento reducido' : manualPaused ? 'Activar movimiento' : 'Pausar movimiento';
    write('[data-t21-pause-label]', text);
    if (!canMove()) resetPointer();
  };

  const selectRoom = (id: RoomId | null) => {
    selected = id;
    const room = ROOMS.find((item) => item.id === id);
    root.dataset.t21Active = id ?? 'all';
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-t21-room]')) {
      button.setAttribute('aria-pressed', String(button.dataset.t21Room === id));
    }
    write('[data-t21-title]', room?.title ?? 'Imagina tu próximo hogar.');
    write('[data-t21-description]', room?.description ?? 'Toca una estancia para descubrirla. Abre el plano para apreciar los detalles.');
    write('[data-t21-number]', room?.number ?? '21');
  };

  const setDialogView = (id: RoomId | null) => {
    const room = ROOMS.find((item) => item.id === id);
    // Zooms the image only. This does not pretend to rotate or reconstruct geometry.
    const zoom = room ? 1.55 : 1;
    dialogArt.style.setProperty('--t21-zoom', String(zoom));
    dialogArt.style.setProperty('--t21-shift-x', `${room ? (50 - room.focusX) * zoom : 0}%`);
    dialogArt.style.setProperty('--t21-shift-y', `${room ? (50 - room.focusY) * zoom : 0}%`);
    dialogArt.dataset.t21Zoomed = String(Boolean(room));
    write('[data-t21-dialog-title]', room ? `${room.label} · ${room.title}` : 'Tu hogar, en detalle.');
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-t21-view]')) {
      button.setAttribute('aria-pressed', String(button.dataset.t21View === (id ?? 'all')));
    }
  };

  const unlockPage = () => {
    if (previousOverflow !== null) {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding ?? '';
      previousOverflow = null;
      previousPadding = null;
    }
  };

  openButton.addEventListener('click', () => {
    if (dialog.open || !dialogSupported) return;
    setDialogView(null);
    try {
      dialog.showModal();
      previousOverflow = document.body.style.overflow;
      previousPadding = document.body.style.paddingRight;
      const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
      if (scrollbar) {
        const padding = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
        document.body.style.paddingRight = `${padding + scrollbar}px`;
      }
      document.body.style.overflow = 'hidden';
      updateMotion();
    } catch {
      // A native dialog failure never prevents the static render or CTAs from working.
      unlockPage();
    }
  }, { signal });

  root.querySelector<HTMLButtonElement>('[data-t21-close]')?.addEventListener('click', () => dialog.close(), { signal });
  dialog.addEventListener('close', () => {
    unlockPage();
    updateMotion();
    if (!destroyed && openButton.isConnected) openButton.focus({ preventScroll: true });
  }, { signal });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }, { signal });

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-t21-room]')) {
    button.addEventListener('click', () => {
      const id = ROOMS.find((item) => item.id === button.dataset.t21Room)?.id;
      if (id) selectRoom(selected === id ? null : id);
    }, { signal });
  }
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-t21-view]')) {
    button.addEventListener('click', () => {
      const id = ROOMS.find((item) => item.id === button.dataset.t21View)?.id ?? null;
      setDialogView(id);
    }, { signal });
  }
  pauseButton.addEventListener('click', () => {
    manualPaused = !manualPaused;
    updateMotion();
  }, { signal });

  pointerArea.addEventListener('pointermove', (event: PointerEvent) => {
    if (!canMove() || !finePointer.matches || event.pointerType !== 'mouse') return;
    const rect = pointerArea.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      art.style.setProperty('--t21-rx', `${(-y * 0.7).toFixed(3)}deg`);
      art.style.setProperty('--t21-ry', `${(x * 0.85).toFixed(3)}deg`);
      art.style.setProperty('--t21-tx', `${(x * 3).toFixed(2)}px`);
    });
  }, { signal });
  pointerArea.addEventListener('pointerleave', resetPointer, { signal });
  document.addEventListener('visibilitychange', updateMotion, { signal });
  motionQuery.addEventListener('change', updateMotion);

  const observer = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      updateMotion();
    }, { threshold: 0.02 })
    : null;
  observer?.observe(root);
  updateMotion();

  return () => {
    destroyed = true;
    if (dialog.open) dialog.close();
    unlockPage();
    lifetime.abort();
    observer?.disconnect();
    motionQuery.removeEventListener('change', updateMotion);
    resetPointer();
    root.dataset.t21Motion = 'off';
    root.dataset.t21Ready = 'false';
    for (const button of buttons) button.disabled = true;
  };
}
