/** Matemática independiente de Three: encuadre conservador de la maqueta completa. */
export const TARGET = [0, 0.48, 0] as const;
const length = Math.hypot(6, 10, 9);
export const DIRECTION = [6 / length, 10 / length, 9 / length] as const;
const horizontal = Math.hypot(DIRECTION[0], DIRECTION[2]);
export const RIGHT = [DIRECTION[2] / horizontal, 0, -DIRECTION[0] / horizontal] as const;
export const UP = [DIRECTION[1] * RIGHT[2],
  DIRECTION[2] * RIGHT[0] - DIRECTION[0] * RIGHT[2], -DIRECTION[1] * RIGHT[0]] as const;
export const BOUNDS = { x: [-3.07, 3.07], y: [-0.45, 1.78], z: [-1.94, 1.94] } as const;
export const YAW_LIMITS = [-0.22, 0.06] as const;

export function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/** El giro nunca presenta la parte trasera. El scroll no introduce la cámara en la casa. */
export function getPose(seconds: number, progress: number, reduced: boolean) {
  const s = reduced ? 0 : clamp01(progress);
  const t = reduced ? 0 : Math.max(0, seconds);
  const ease = reduced ? 1 : 1 - (1 - clamp01(t / 1.4)) ** 3;
  return {
    yaw: -0.12 + s * 0.12 + (reduced ? 0 : Math.sin(t * 0.22) * 0.035) - (1 - ease) * 0.04,
    height: reduced ? 0 : Math.sin(t * 0.45) * 0.012 - (1 - ease) * 0.035,
    scale: 0.96 + ease * 0.04,
    door: -0.12 - s * 0.18,
    occupancy: 0.80 + s * 0.035,
  };
}

/** Proyección en los ejes de la cámara elevada. */
export function project(x: number, y: number, z: number, yaw: number) {
  const px = x * Math.cos(yaw) + z * Math.sin(yaw);
  const pz = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const py = y - TARGET[1];
  return [px * RIGHT[0] + pz * RIGHT[2], px * UP[0] + py * UP[1] + pz * UP[2]] as const;
}

// Una envolvente común a TODAS las orientaciones evita cambios de tamaño por el giro.
const envelope = (() => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let step = 0; step <= 56; step++) {
    const yaw = YAW_LIMITS[0] + step / 56 * (YAW_LIMITS[1] - YAW_LIMITS[0]);
    for (const x of BOUNDS.x) for (const y of BOUNDS.y) for (const z of BOUNDS.z) {
      const [u, v] = project(x, y, z, yaw);
      minX = Math.min(minX, u); maxX = Math.max(maxX, u);
      minY = Math.min(minY, v); maxY = Math.max(maxY, v);
    }
  }
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
    // Margen geométrico adicional al margen de composición.
    halfX: (maxX - minX) / 2 + 0.06, halfY: (maxY - minY) / 2 + 0.06 };
})();

export function frameForAspect(aspect: number, occupancy = 0.80) {
  const a = Number.isFinite(aspect) ? Math.max(0.05, aspect) : 1;
  const fill = Math.min(0.84, Math.max(0.5, occupancy));
  const halfH = Math.max(envelope.halfY, envelope.halfX / a) / fill;
  return { left: envelope.cx - halfH * a, right: envelope.cx + halfH * a,
    bottom: envelope.cy - halfH, top: envelope.cy + halfH };
}
