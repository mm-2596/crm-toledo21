"use client";

import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState,
  type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { HomeModel } from "./home-model";
import { HeroPoster } from "./hero-poster";
import { clamp01 } from "./framing";
import type { Hero3DProps } from "./types";

/** Dirección artística de esta variante ("joya"): ver hero-canvas.tsx Runtime. */
const ART = {
  OBJECT_X: 1.05,
  OBJECT_Y: -0.12,
  CAMERA_LOOK_X: 0.92,
  CAMERA_LOOK_Y: 0.75,
  FOV_DEG: 32,
  HALF_W: 1.95,
  HALF_H: 1.05,
  INTRO_SECONDS: 1.25,
  IDLE_SPIN: 0.12,
  SCROLL_YAW: 0.42,
  FLOAT_Y: 0.04,
} as const;

/** Distancia mínima de cámara para que el bounding box (HALF_W x HALF_H) quepa
 * en el contenedor real, sea cual sea su aspect ratio (evita el objeto
 * "enorme" recortado que motivó la corrección anterior). */
function cameraDistanceForAspect(aspect: number): number {
  const fovRad = THREE.MathUtils.degToRad(ART.FOV_DEG);
  const distForHeight = ART.HALF_H / Math.tan(fovRad / 2);
  const distForWidth = ART.HALF_W / (Math.tan(fovRad / 2) * Math.max(0.01, aspect));
  return Math.max(distForHeight, distForWidth);
}

function getPose(seconds: number, progress: number, sinceMount: number, reduced: boolean) {
  const s = reduced ? 0 : clamp01(progress);
  const t = reduced ? 0 : seconds;
  const introRaw = reduced ? 1 : clamp01(sinceMount / ART.INTRO_SECONDS);
  const introEase = 1 - (1 - introRaw) ** 3;
  const introSpin = reduced ? 0 : (1 - introEase) * 0.55;
  const overshoot = reduced ? 1 : 1 + Math.sin(introRaw * Math.PI) * 0.05 * (1 - introRaw);
  return {
    scale: (0.9 + introEase * 0.1) * overshoot,
    posY: ART.OBJECT_Y + (reduced ? 0 : Math.sin(t * 0.6) * ART.FLOAT_Y),
    rotX: -0.08 + (reduced ? 0 : Math.sin(t * 0.22) * 0.01),
    rotY: -0.48 + s * ART.SCROLL_YAW + (reduced ? 0 : t * ART.IDLE_SPIN) + introSpin,
    roofY: THREE.MathUtils.lerp(1.28, 1.42, s),
    roofRotY: THREE.MathUtils.lerp(0, 0.05, s),
    doorRotY: THREE.MathUtils.lerp(0, -0.52, s),
    portalRotY: -0.2 + (reduced ? 0 : Math.sin(t * 0.35) * 0.04),
    camX: 0.12 + (reduced ? 0 : Math.sin(t * 0.12) * 0.08) + s * 0.08,
    camY: 0.48 + s * 0.1,
    zoomFactor: THREE.MathUtils.lerp(1.08, 0.96, s),
  };
}

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void }, { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? <HeroPoster /> : this.props.children; }
}

function Studio() {
  return (
    <Environment resolution={128} frames={1} background={false} environmentIntensity={0.65}>
      <Lightformer position={[-4, 5, 3]} scale={[4, 4, 1]} intensity={3.5} color="#fff6e8"
        onUpdate={(self) => self.lookAt(0, 0, 0)} />
      <Lightformer position={[4, 3, -4]} scale={[3, 3, 1]} intensity={2} color="#ffffff"
        onUpdate={(self) => self.lookAt(0, 0, 0)} />
      <Lightformer position={[0, 6, 0]} scale={[6, 3, 1]} intensity={1.5} color="#ffffff"
        onUpdate={(self) => self.lookAt(0, 0, 0)} />
    </Environment>
  );
}

type RuntimeProps = {
  progress: Hero3DProps["progress"];
  active: boolean;
  reduced: boolean;
  paused: boolean;
  onReady: () => void;
  onFailure: () => void;
};

function Runtime({ progress, active, reduced, paused, onReady, onFailure }: RuntimeProps) {
  const root = useRef<THREE.Group>(null);
  const roof = useRef<THREE.Group>(null);
  const door = useRef<THREE.Group>(null);
  const portal = useRef<THREE.Group>(null);
  const seconds = useRef(0);
  const scroll = useRef(clamp01(progress.get()));
  const mountTime = useRef<number | null>(null);
  const readySent = useRef(false);
  const { camera, size, invalidate, gl } = useThree();

  useEffect(() => {
    const lost = () => onFailure();
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);

  useEffect(() => { invalidate(); }, [active, reduced, paused, size.width, size.height, invalidate]);

  useFrame(({ clock }, delta) => {
    if (!root.current || !roof.current || !door.current || !portal.current) return;
    if (mountTime.current === null) mountTime.current = clock.elapsedTime;
    const dt = Math.min(Math.max(delta, 0), 0.05);
    if (active && !paused && !reduced) {
      seconds.current += dt;
      scroll.current = THREE.MathUtils.damp(scroll.current, clamp01(progress.get()), 7, dt);
    }
    const sinceMount = clock.elapsedTime - mountTime.current;
    const pose = getPose(seconds.current, scroll.current, sinceMount, reduced);

    root.current.scale.setScalar(pose.scale);
    root.current.position.set(ART.OBJECT_X, pose.posY, 0);
    root.current.rotation.set(pose.rotX, pose.rotY, 0);
    roof.current.position.y = pose.roofY;
    roof.current.rotation.y = pose.roofRotY;
    door.current.rotation.y = pose.doorRotY;
    portal.current.rotation.y = pose.portalRotY;

    const aspect = size.width / Math.max(1, size.height);
    const camZ = cameraDistanceForAspect(aspect) * pose.zoomFactor;
    camera.position.set(pose.camX, pose.camY, camZ);
    camera.lookAt(ART.CAMERA_LOOK_X, ART.CAMERA_LOOK_Y, 0);

    if (!readySent.current) {
      readySent.current = true;
      // Una única notificación; no se actualiza React en cada fotograma.
      onReady();
    }
    // Sin bucle en pestaña oculta, fuera de pantalla, pausado o movimiento reducido.
    if (active && !paused && !reduced) invalidate();
  });

  return (
    <group ref={root}>
      <HomeModel roofRef={roof} doorRef={door} portalRef={portal} />
    </group>
  );
}

/** Exportado por separado para permitir la carga dinámica sin SSR. */
export function HeroCanvas({ progress, quality = "auto", showMotionToggle = true }: Hero3DProps) {
  const host = useRef<HTMLDivElement>(null);
  const reducedPreference = useReducedMotion();
  // Mientras la preferencia aún no se conoce, no se inicia una animación.
  const reduced = reducedPreference !== false;
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const low = quality === "low" || (quality === "auto" && mobile);
  const active = visible && pageVisible;
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  const dpr = useMemo<[number, number]>(() => [1, low ? 1 : 1.5], [low]);

  useEffect(() => {
    // Igual que FavoritesContext/CompareContext: este setState post-montaje
    // es intencional (habilita el Canvas solo tras hidratar en cliente).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
    const media = window.matchMedia("(max-width: 767px)");
    const updateMedia = () => setMobile(media.matches);
    const updatePage = () => setPageVisible(document.visibilityState === "visible");
    const connection = (navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean };
    }).connection;
    const updateData = () => setSaveData(connection?.saveData === true);
    updateMedia(); updatePage(); updateData();
    media.addEventListener("change", updateMedia);
    document.addEventListener("visibilitychange", updatePage);
    connection?.addEventListener("change", updateData);
    const observer = typeof IntersectionObserver === "undefined" ? null :
      new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    if (host.current) observer?.observe(host.current);
    return () => {
      media.removeEventListener("change", updateMedia);
      document.removeEventListener("visibilitychange", updatePage);
      connection?.removeEventListener("change", updateData);
      observer?.disconnect();
    };
  }, []);

  const usePoster = !hydrated || failed || saveData;
  return (
    <div ref={host} data-toledo21-scene-v2 data-motion={reduced ? "reduced" : paused ? "paused" : "running"}
      style={{ position: "absolute", inset: 0, isolation: "isolate" }}>
      <div role="img" aria-label="Maqueta conceptual de una vivienda con salón, dormitorio y terraza."
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {usePoster || !ready ? <HeroPoster /> : null}
        {!usePoster && (
          <SceneBoundary onFailure={onFailure}>
            <Canvas dpr={dpr} frameloop="demand" shadows="soft"
              camera={{ position: [0.12, 0.48, 8], fov: ART.FOV_DEG }}
              gl={{ antialias: true, alpha: true, powerPreference: "default" }}
              fallback={<HeroPoster />}
              style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: ready ? 1 : 0 }}
              onCreated={({ gl }) => { gl.toneMappingExposure = 1.05; }}>
              <hemisphereLight args={["#fff8eb", "#796956", 1.25]} />
              <directionalLight position={[-3, 7, 5]} intensity={3} color="#fff3df" castShadow
                shadow-mapSize={[low ? 512 : 1024, low ? 512 : 1024]}
                shadow-camera-left={-5} shadow-camera-right={5}
                shadow-camera-top={5} shadow-camera-bottom={-5}
                shadow-camera-near={0.5} shadow-camera-far={22}
                shadow-normalBias={0.025} shadow-bias={-0.0001} />
              <directionalLight position={[4, 4, -2]} intensity={1.0} color="#ffffff" />
              <Suspense fallback={null}>
                <Studio />
                <Runtime progress={progress} active={active} reduced={reduced} paused={paused}
                  onReady={onReady} onFailure={onFailure} />
              </Suspense>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.41, 0]} receiveShadow>
                <planeGeometry args={[24, 24]} />
                <shadowMaterial transparent opacity={0.20} />
              </mesh>
            </Canvas>
          </SceneBoundary>
        )}
      </div>
      {showMotionToggle && !reduced && !usePoster && ready && (
        <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}
          aria-label={paused ? "Reanudar animación de la vivienda" : "Pausar animación de la vivienda"}
          style={{ position: "absolute", right: 16, bottom: 12, zIndex: 2, pointerEvents: "auto",
            minHeight: 44, padding: "10px 15px", borderRadius: 999,
            border: "1px solid rgba(217,174,116,.38)", background: "rgba(22,18,16,.90)",
            color: "#e5d3b9", font: "inherit", fontSize: 12, cursor: "pointer" }}>
          {paused ? "Reanudar animación" : "Pausar animación"}
        </button>
      )}
    </div>
  );
}
