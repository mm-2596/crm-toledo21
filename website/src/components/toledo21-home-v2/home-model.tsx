"use client";

import type { RefObject } from "react";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";

const BRAND = {
  ink: "#161210",
  ink2: "#211815",
  gold: "#a9834f",
  goldLight: "#d9ae74",
  goldPale: "#f3d9ad",
  wall: "#f2eee7",
  stone: "#d8d0c5",
  linen: "#ddd6cd",
  wood: "#8d6544",
  moss: "#7c9278",
} as const;

function Glass({
  position,
  size,
  rotation,
}: {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color="#e8eef3"
        transparent
        opacity={0.18}
        transmission={0.82}
        roughness={0.06}
        metalness={0}
        thickness={0.24}
        ior={1.2}
      />
    </mesh>
  );
}

function GoldFin({
  position,
  args,
}: {
  position: [number, number, number];
  args: [number, number, number];
}) {
  return (
    <RoundedBox position={position} args={args} radius={0.02} smoothness={4} castShadow receiveShadow>
      <meshStandardMaterial color={BRAND.goldLight} metalness={1} roughness={0.24} />
    </RoundedBox>
  );
}

function Sofa() {
  return (
    <group position={[-0.55, 0.16, 0.2]}>
      <RoundedBox args={[0.72, 0.16, 0.32]} radius={0.035} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={BRAND.linen} roughness={0.92} />
      </RoundedBox>
      <RoundedBox position={[0, 0.15, -0.08]} args={[0.72, 0.24, 0.11]} radius={0.03} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#e6dfd6" roughness={0.95} />
      </RoundedBox>
      <RoundedBox position={[-0.31, 0.12, 0]} args={[0.08, 0.2, 0.29]} radius={0.025} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#e1d9cf" roughness={0.95} />
      </RoundedBox>
      <RoundedBox position={[0.31, 0.12, 0]} args={[0.08, 0.2, 0.29]} radius={0.025} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#e1d9cf" roughness={0.95} />
      </RoundedBox>
    </group>
  );
}

function CoffeeTable() {
  return (
    <group position={[-0.16, 0.13, 0.12]}>
      <RoundedBox args={[0.36, 0.025, 0.2]} radius={0.025} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={BRAND.stone} roughness={0.74} />
      </RoundedBox>
      {[-0.13, 0.13].map((x) =>
        [-0.07, 0.07].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.065, z]} castShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.13, 10]} />
            <meshStandardMaterial color={BRAND.gold} metalness={1} roughness={0.26} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Bed() {
  return (
    <group position={[-0.1, 0.16, -0.36]}>
      <RoundedBox args={[0.66, 0.13, 0.42]} radius={0.03} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#e8e2d8" roughness={0.94} />
      </RoundedBox>
      <RoundedBox position={[0, 0.11, -0.13]} args={[0.66, 0.18, 0.08]} radius={0.02} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={BRAND.linen} roughness={0.95} />
      </RoundedBox>
      <RoundedBox position={[-0.15, 0.09, 0.02]} args={[0.18, 0.05, 0.12]} radius={0.02} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#f0ebe4" roughness={0.97} />
      </RoundedBox>
      <RoundedBox position={[0.15, 0.09, 0.02]} args={[0.18, 0.05, 0.12]} radius={0.02} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#f0ebe4" roughness={0.97} />
      </RoundedBox>
    </group>
  );
}

function TerraceSet() {
  return (
    <group position={[0.8, 0.14, 0.22]}>
      <RoundedBox args={[0.22, 0.02, 0.22]} radius={0.025} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={BRAND.wood} roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.32, 12]} />
        <meshStandardMaterial color={BRAND.goldLight} metalness={1} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.018, 24]} />
        <meshStandardMaterial color={BRAND.stone} roughness={0.76} />
      </mesh>
      <group position={[0.28, 0.02, 0]}>
        <RoundedBox position={[0, 0.12, 0]} args={[0.13, 0.22, 0.13]} radius={0.02} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={BRAND.linen} roughness={0.95} />
        </RoundedBox>
        <RoundedBox position={[0, 0.28, -0.05]} args={[0.13, 0.22, 0.04]} radius={0.02} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={BRAND.linen} roughness={0.95} />
        </RoundedBox>
      </group>
    </group>
  );
}

function Plant() {
  return (
    <group position={[1.0, 0.12, -0.36]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.065, 0.05, 0.14, 18]} />
        <meshStandardMaterial color={BRAND.stone} roughness={0.88} />
      </mesh>
      {[0, 0.8, 1.6, 2.4, 3.2].map((r, i) => (
        <mesh
          key={i}
          position={[Math.sin(r) * 0.03, 0.12 + i * 0.04, Math.cos(r) * 0.03]}
          rotation={[0, r, Math.PI / 4]}
          castShadow
        >
          <sphereGeometry args={[0.065 - i * 0.005, 10, 10]} />
          <meshStandardMaterial color={i % 2 === 0 ? BRAND.moss : "#6e8769"} roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}

function PortalFrame({ portalRef }: { portalRef: RefObject<Group | null> }) {
  return (
    <group ref={portalRef} position={[0.12, 0.88, -0.64]} rotation={[0.03, -0.2, 0]}>
      <GoldFin position={[0, 0.82, 0]} args={[2.5, 0.05, 0.05]} />
      <GoldFin position={[0, -0.82, 0]} args={[2.5, 0.05, 0.05]} />
      <GoldFin position={[-1.22, 0, 0]} args={[0.05, 1.7, 0.05]} />
      <GoldFin position={[1.22, 0, 0]} args={[0.05, 1.7, 0.05]} />
    </group>
  );
}

type HomeModelProps = {
  roofRef: RefObject<Group | null>;
  doorRef: RefObject<Group | null>;
  portalRef: RefObject<Group | null>;
};

/** Escena conceptual "joya": salón, dormitorio y terraza en corte, remate dorado. */
export function HomeModel({ roofRef, doorRef, portalRef }: HomeModelProps) {
  return (
    <>
      <PortalFrame portalRef={portalRef} />

      {/* Base / plinth */}
      <RoundedBox args={[3.45, 0.18, 2.28]} radius={0.12} smoothness={5} receiveShadow>
        <meshPhysicalMaterial color={BRAND.ink2} roughness={0.42} metalness={0.15} clearcoat={1} clearcoatRoughness={0.12} />
      </RoundedBox>

      <RoundedBox position={[0, 0.1, 0]} args={[3.18, 0.03, 2.0]} radius={0.08} smoothness={5} receiveShadow>
        <meshStandardMaterial color={BRAND.gold} metalness={1} roughness={0.25} />
      </RoundedBox>

      {/* House */}
      <group position={[0.05, 0.2, 0]}>
        <RoundedBox args={[2.45, 0.1, 1.55]} radius={0.05} smoothness={5} castShadow receiveShadow>
          <meshStandardMaterial color={BRAND.wood} roughness={0.84} />
        </RoundedBox>

        <RoundedBox position={[0.82, 0, 0.28]} args={[0.68, 0.085, 0.56]} radius={0.04} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={BRAND.wood} roughness={0.86} />
        </RoundedBox>

        <RoundedBox position={[-0.05, 0.02, 0]} args={[2.15, 0.025, 1.3]} radius={0.02} smoothness={4} receiveShadow>
          <meshStandardMaterial color="#ece6dd" roughness={0.95} />
        </RoundedBox>

        <RoundedBox position={[0.02, 0.76, -0.72]} args={[2.24, 1.5, 0.08]} radius={0.035} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={BRAND.wall} roughness={0.82} />
        </RoundedBox>

        <RoundedBox position={[1.08, 0.66, -0.06]} args={[0.08, 1.32, 1.2]} radius={0.035} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={BRAND.wall} roughness={0.82} />
        </RoundedBox>

        <RoundedBox position={[-0.2, 0.56, -0.18]} args={[0.08, 1.12, 1.0]} radius={0.03} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={BRAND.wall} roughness={0.82} />
        </RoundedBox>

        <RoundedBox position={[0.6, 0.42, 0.55]} args={[0.98, 0.84, 0.06]} radius={0.03} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={BRAND.wall} roughness={0.82} />
        </RoundedBox>

        <group ref={roofRef} position={[0, 1.28, 0]}>
          <RoundedBox args={[2.62, 0.1, 1.72]} radius={0.06} smoothness={5} castShadow receiveShadow>
            <meshPhysicalMaterial color={BRAND.ink} roughness={0.36} metalness={0.28} clearcoat={1} clearcoatRoughness={0.1} />
          </RoundedBox>
          <RoundedBox position={[0, -0.064, 0]} args={[2.5, 0.014, 1.58]} radius={0.04} smoothness={4}>
            <meshStandardMaterial color={BRAND.goldLight} metalness={1} roughness={0.22} />
          </RoundedBox>
        </group>

        {[-0.92, -0.86, -0.8].map((x, i) => (
          <GoldFin key={i} position={[x, 0.62, 0.52]} args={[0.02, 1.08, 0.04]} />
        ))}

        <Glass position={[0.54, 0.74, -0.71]} size={[0.88, 0.68, 0.02]} />
        <Glass position={[0.84, 0.7, 0.56]} size={[0.42, 0.72, 0.02]} />
        <Glass position={[1.06, 0.72, 0.08]} size={[0.02, 0.72, 0.88]} rotation={[0, Math.PI / 2, 0]} />

        <group position={[0.9, 0.02, 0.56]}>
          <RoundedBox position={[0, 0.56, 0]} args={[0.42, 1.12, 0.04]} radius={0.03} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color={BRAND.goldLight} metalness={1} roughness={0.24} />
          </RoundedBox>

          <group ref={doorRef} position={[-0.18, 0.02, 0.03]}>
            <group position={[0, 0.54, 0]}>
              <RoundedBox position={[0.18, 0, 0]} args={[0.36, 1.04, 0.03]} radius={0.025} smoothness={4} castShadow receiveShadow>
                <meshPhysicalMaterial color={BRAND.ink} roughness={0.28} metalness={0.45} clearcoat={1} clearcoatRoughness={0.08} />
              </RoundedBox>
              <mesh position={[0.31, 0, 0.025]} castShadow>
                <sphereGeometry args={[0.022, 14, 14]} />
                <meshStandardMaterial color={BRAND.goldPale} metalness={1} roughness={0.2} />
              </mesh>
            </group>
          </group>
        </group>

        <Sofa />
        <CoffeeTable />
        <Bed />
        <TerraceSet />
        <Plant />

        <mesh position={[-0.12, 0.09, 0.08]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[0.1, 0.18, 32]} />
          <meshStandardMaterial color="#d9d0c5" roughness={0.98} />
        </mesh>
      </group>
    </>
  );
}
