import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import {
  Clone,
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import { memo, Suspense, useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { soundPlayer } from "../audio/soundPlayer";
import { stationLabels, type StationId } from "../game/catalog";
import { resolveCafeMovement } from "../game/movement";
import { useGame } from "../game/store";

type Point = readonly [number, number, number];
type StationPlacement = Readonly<{
  id: StationId;
  model?: string;
  position: Point;
  rotation?: Point;
  scale?: number;
  minStage?: number;
}>;

const stations: readonly StationPlacement[] = [
  { id: "grinder", model: "grinder.glb", position: [-5.25, 1.26, -3.72], scale: 0.78 },
  { id: "espresso", model: "espresso-machine.glb", position: [-3.42, 1.26, -3.72], scale: 0.8 },
  { id: "steam", position: [-2.52, 1.26, -3.72] },
  { id: "cups", model: "cup-shelf.glb", position: [-1.35, 1.26, -3.72], scale: 0.7 },
  { id: "water", model: "hot-water-dispenser.glb", position: [-0.1, 1.26, -3.72], scale: 0.68 },
  {
    id: "coldWater",
    model: "cold-water-dispenser.glb",
    position: [0.85, 1.26, -3.72],
    scale: 0.62,
    minStage: 2,
  },
  { id: "coldCups", model: "cold-cup-shelf.glb", position: [1.7, 1.26, -3.72], scale: 0.56, minStage: 2 },
  {
    id: "sparkling",
    model: "sparkling-machine.glb",
    position: [2.65, 1.26, -3.72],
    scale: 0.58,
    minStage: 8,
  },
  { id: "fridge", model: "ingredient-fridge.glb", position: [5.75, 0, -3.9], scale: 1.05 },
  {
    id: "ice",
    model: "ice-machine.glb",
    position: [-6.55, 1.26, 1.25],
    rotation: [0, Math.PI / 2, 0],
    scale: 0.72,
    minStage: 2,
  },
  {
    id: "coldBrew",
    model: "cold-brew-tower.glb",
    position: [-6.55, 1.26, 2.35],
    rotation: [0, Math.PI / 2, 0],
    scale: 0.62,
    minStage: 13,
  },
  {
    id: "blender",
    model: "blender.glb",
    position: [-6.55, 1.26, 3.25],
    rotation: [0, Math.PI / 2, 0],
    scale: 0.62,
    minStage: 15,
  },
  { id: "serve", model: "pickup-bell.glb", position: [5.35, 1.26, 3.55], scale: 0.5 },
];

const clampDestination = (point: THREE.Vector3) =>
  point.set(THREE.MathUtils.clamp(point.x, -5.55, 5.95), 0, THREE.MathUtils.clamp(point.z, -2.5, 5.05));

const GlbModel = ({ url, scale = 1 }: Readonly<{ url: string; scale?: number }>) => {
  const gltf = useGLTF(url);
  return <Clone object={gltf.scene} scale={scale} castShadow receiveShadow />;
};

const Station = ({ placement, near }: Readonly<{ placement: StationPlacement; near: boolean }>) => {
  const runtime = useGame(({ shift }) => shift.stations[placement.id]);
  const fever = useGame(({ shift }) => shift.fever);
  const effect = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const working = runtime.phase === "processing";
    if (effect.current) {
      effect.current.rotation.y = working ? clock.elapsedTime * 3 : 0;
      effect.current.position.y = working ? 0.15 + Math.sin(clock.elapsedTime * 9) * 0.08 : 0.15;
    }
    if (body.current) {
      const ready = runtime.phase === "ready";
      body.current.position.y = working
        ? Math.sin(clock.elapsedTime * 22) * 0.012
        : ready
          ? Math.abs(Math.sin(clock.elapsedTime * 5)) * 0.035
          : 0;
      body.current.rotation.z = working ? Math.sin(clock.elapsedTime * 26) * 0.004 : 0;
      body.current.scale.setScalar(ready ? 1 + Math.sin(clock.elapsedTime * 5) * 0.012 : 1);
    }
  });
  const progress = runtime.total
    ? Math.round(((runtime.total - runtime.remaining) / runtime.total) * 100)
    : 0;
  const showLabel = near || runtime.phase !== "idle";
  return (
    <group
      position={[...placement.position]}
      rotation={placement.rotation ? [...placement.rotation] : undefined}
    >
      <group ref={body}>
        {placement.model ? (
          <GlbModel url={`/assets/models/${placement.model}`} scale={placement.scale} />
        ) : null}
      </group>
      <group ref={effect}>
        {runtime.phase === "processing" ? (
          <>
            <mesh>
              <torusGeometry args={[0.48, 0.055, 8, 24]} />
              <meshStandardMaterial
                color={fever ? "#fff36b" : "#ffbb4d"}
                emissive={fever ? "#ffdf32" : "#ff7a18"}
                emissiveIntensity={fever ? 4 : 2}
              />
            </mesh>
            {fever ? (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.62, 0.035, 8, 24]} />
                <meshStandardMaterial color="#66e8ff" emissive="#36cfff" emissiveIntensity={4} />
              </mesh>
            ) : null}
            <pointLight
              color={fever ? "#ffe866" : "#ffad42"}
              intensity={fever ? 6 : 3}
              distance={fever ? 4 : 2.8}
            />
          </>
        ) : null}
        {runtime.phase === "ready" ? (
          <>
            <mesh>
              <octahedronGeometry args={[0.22]} />
              <meshStandardMaterial color="#8dffad" emissive="#43df79" emissiveIntensity={2.5} />
            </mesh>
            <pointLight color="#64ff9a" intensity={2.5} distance={2.5} />
          </>
        ) : null}
      </group>
      {near ? <pointLight position={[0, 1.3, 0.3]} color="#ffd276" intensity={2.4} distance={3} /> : null}
      {showLabel ? (
        <Html center position={[0, -0.32, 0.78]} className={`world-label ${near ? "near" : ""}`}>
          {near ? "SPACE · " : ""}
          {stationLabels[placement.id]}
          {runtime.phase === "processing"
            ? ` · ${progress}% (${runtime.remaining}s)`
            : runtime.phase === "ready"
              ? " · 완료"
              : ""}
        </Html>
      ) : null}
    </group>
  );
};

const CharacterCameraFocus = ({ position }: Readonly<{ position: RefObject<THREE.Vector3> }>) => {
  const { camera, controls, size } = useThree();
  const initialized = useRef(false);
  const previous = useRef(new THREE.Vector3());
  useFrame(() => {
    const current = position.current;
    const orbit = controls as { target?: THREE.Vector3; update?: () => void } | null;
    if (!current || !orbit?.target) return;
    if (!initialized.current) {
      const shift = new THREE.Vector3(current.x, 0.8, current.z).sub(orbit.target);
      camera.position.add(shift);
      orbit.target.add(shift);
      previous.current.copy(current);
      initialized.current = true;
    } else {
      const shift = current.clone().sub(previous.current);
      camera.position.add(shift);
      orbit.target.add(shift);
      previous.current.copy(current);
    }
    if (camera instanceof THREE.PerspectiveCamera) {
      const desiredFov = size.width / size.height < 0.75 ? 68 : 43;
      if (camera.fov !== desiredFov) {
        camera.fov = desiredFov;
        camera.updateProjectionMatrix();
      }
    }
    orbit.update?.();
  });
  return null;
};

const CharacterController = () => {
  const interact = useGame(({ interact }) => interact);
  const combine = useGame(({ combine }) => combine);
  const inventory = useGame(({ shift }) => shift.inventory);
  const select = useGame(({ select }) => select);
  const activeWork = useGame(({ shift }) => shift.activeWork);
  const fever = useGame(({ shift }) => shift.fever);
  const stageId = useGame(({ shift }) => shift.stageId);
  const fridgeOpen = useGame(({ fridgeOpen }) => fridgeOpen);
  const movementLevel = useGame(({ upgrades }) => upgrades.movement);
  const setNearbyStation = useGame(({ setNearbyStation }) => setNearbyStation);
  const root = useRef<THREE.Group>(null);
  const keys = useRef(new Set<string>());
  const position = useRef(new THREE.Vector3(0, 0, 1.3));
  const destination = useRef<THREE.Vector3 | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const limbs = useRef<{ legs: THREE.Object3D[]; arms: THREE.Object3D[] } | null>(null);
  const feverEffect = useRef<THREE.Group>(null);
  const [near, setNear] = useState<StationId | null>(null);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (fridgeOpen) return;
      keys.current.add(event.key.toLowerCase());
      if (event.code === "Space") {
        event.preventDefault();
        if (near) interact(near);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        combine();
      }
      if (/^[1-9]$/.test(event.key)) {
        const selected = inventory[Number(event.key) - 1];
        if (selected) select(selected.uid);
      }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [combine, fridgeOpen, interact, inventory, near, select]);
  useEffect(() => {
    if (fridgeOpen) {
      keys.current.clear();
      destination.current = null;
    }
  }, [fridgeOpen]);
  useEffect(() => {
    if (activeWork) destination.current = null;
  }, [activeWork]);

  useFrame(({ camera, clock }, delta) => {
    const movementLocked = fridgeOpen || (Boolean(activeWork) && !fever);
    if (feverEffect.current) {
      feverEffect.current.rotation.y = clock.elapsedTime * 3.5;
      feverEffect.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 7) * 0.08);
    }
    const horizontal =
      Number(keys.current.has("d") || keys.current.has("arrowright")) -
      Number(keys.current.has("a") || keys.current.has("arrowleft"));
    const vertical =
      Number(keys.current.has("w") || keys.current.has("arrowup")) -
      Number(keys.current.has("s") || keys.current.has("arrowdown"));
    const direction = new THREE.Vector3();
    if (!movementLocked && (horizontal || vertical)) {
      destination.current = null;
      const forward = camera.getWorldDirection(new THREE.Vector3());
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      direction.addScaledVector(right, horizontal).addScaledVector(forward, vertical).normalize();
    } else if (!movementLocked && destination.current) {
      direction.subVectors(destination.current, position.current);
      direction.y = 0;
      if (direction.length() < 0.08) destination.current = null;
      else direction.normalize();
    }
    const moving = direction.lengthSq() > 0;
    if (moving) {
      const movementSpeed = 3.3 * (1 + movementLevel * 0.1) * (fever ? 1.65 : 1);
      const movement = direction.clone().multiplyScalar(delta * movementSpeed);
      const previousPosition = position.current.clone();
      const resolved = resolveCafeMovement(
        { x: position.current.x, z: position.current.z },
        { x: movement.x, z: movement.z },
      );
      position.current.set(resolved.x, 0, resolved.z);
      if (destination.current && position.current.distanceToSquared(previousPosition) < 0.000001)
        destination.current = null;
      if (root.current) root.current.rotation.y = Math.atan2(direction.x, direction.z);
      soundPlayer.playFootstep();
    }
    if (root.current) {
      if (!limbs.current) {
        const legs: THREE.Object3D[] = [];
        const arms: THREE.Object3D[] = [];
        root.current.traverse((part) => {
          if (part.name.includes("Leg")) legs.push(part);
          if (part.name.includes("Sleeve") || part.name.includes("Arm")) arms.push(part);
        });
        limbs.current = { legs, arms };
      }
      const walkPhase = Math.sin(clock.elapsedTime * (fever ? 15 : 10));
      limbs.current.legs.forEach((leg, index) => {
        leg.rotation.x = moving ? walkPhase * (index % 2 ? -0.55 : 0.55) : 0;
      });
      limbs.current.arms.forEach((arm, index) => {
        arm.rotation.x = activeWork
          ? -0.75 + Math.sin(clock.elapsedTime * 12 + index) * 0.28
          : moving
            ? walkPhase * (index % 2 ? 0.42 : -0.42)
            : 0;
      });
      if (activeWork && !moving) {
        const target = stations.find(({ id }) => id === activeWork);
        if (target)
          root.current.rotation.y = Math.atan2(
            target.position[0] - position.current.x,
            target.position[2] - position.current.z,
          );
      }
      root.current.position.copy(position.current);
      root.current.position.y = moving
        ? Math.abs(Math.sin(clock.elapsedTime * 10)) * 0.1
        : activeWork
          ? Math.sin(clock.elapsedTime * 12) * 0.025
          : 0;
    }
    let closest: StationId | null = null;
    let distance = 1.55;
    for (const placement of stations) {
      if ((placement.minStage ?? 1) > stageId) continue;
      const id = placement.id;
      const target = new THREE.Vector3(...placement.position);
      const current = Math.hypot(position.current.x - target.x, position.current.z - target.z);
      if (current < distance) {
        distance = current;
        closest = id;
      }
    }
    if (closest !== near) {
      setNear(closest);
      setNearbyStation(closest);
    }
  });

  const beginPointer = (event: ThreeEvent<PointerEvent>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };
  const finishPointer = (event: ThreeEvent<PointerEvent>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 7) return;
    if (!fridgeOpen && (!activeWork || fever)) destination.current = clampDestination(event.point.clone());
  };

  return (
    <>
      <mesh
        position={[0.2, 0.035, 0.75]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={beginPointer}
        onPointerUp={finishPointer}
      >
        <planeGeometry args={[13.5, 8.25]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={root} position={[0, 0, 1.3]}>
        <GlbModel url="/assets/models/jieun.glb" scale={0.82} />
        {fever ? (
          <group ref={feverEffect}>
            {Array.from({ length: 8 }, (_, index) => (
              <mesh
                key={index}
                position={[
                  Math.cos((index * Math.PI) / 4) * 0.75,
                  0.8 + (index % 3) * 0.35,
                  Math.sin((index * Math.PI) / 4) * 0.75,
                ]}
              >
                <sphereGeometry args={[0.07 + (index % 2) * 0.035, 8, 8]} />
                <meshStandardMaterial
                  color={index % 2 ? "#fff08a" : "#ff8a3d"}
                  emissive="#ffb12e"
                  emissiveIntensity={3}
                />
              </mesh>
            ))}
          </group>
        ) : null}
      </group>
      <CharacterCameraFocus position={position} />
      {stations
        .filter(({ minStage = 1 }) => minStage <= stageId)
        .map((placement) => (
          <Station key={placement.id} placement={placement} near={near === placement.id} />
        ))}
    </>
  );
};

const CustomerFlow = () => {
  const orderSequence = useGame(({ shift }) => shift.orderSequence);
  const orderName = useGame(({ shift }) => shift.order.name);
  const root = useRef<THREE.Group>(null);
  const phase = useRef<"enter" | "wait" | "exit">("enter");
  const previous = useRef(orderSequence);
  const x = useRef(7.4);
  useEffect(() => {
    if (orderSequence > previous.current) {
      phase.current = "exit";
      previous.current = orderSequence;
    }
  }, [orderSequence]);
  useFrame(({ clock }, delta) => {
    if (!root.current) return;
    if (phase.current === "enter") {
      x.current = Math.max(4.65, x.current - delta * 2.2);
      if (x.current <= 4.65) phase.current = "wait";
    } else if (phase.current === "exit") {
      x.current += delta * 2.7;
      if (x.current >= 7.4) {
        x.current = 7.4;
        phase.current = "enter";
      }
    }
    root.current.position.set(x.current, Math.abs(Math.sin(clock.elapsedTime * 5)) * 0.035, 4.82);
    root.current.rotation.y = phase.current === "exit" ? Math.PI / 2 : -Math.PI / 2;
  });
  return (
    <group ref={root} position={[7.4, 0, 4.82]}>
      <GlbModel url="/assets/models/customer.glb" scale={0.72} />
      <Html center position={[0, 2.35, 0]} className="customer-order">
        <small>ORDER</small>
        <b>{orderName}</b>
      </Html>
    </group>
  );
};

const Interior = () => (
  <>
    <color attach="background" args={["#17120f"]} />
    <ambientLight intensity={1.45} />
    <directionalLight position={[5, 10, 6]} intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} />
    <PerspectiveCamera makeDefault position={[8.1, 7.2, 10.3]} fov={40} near={0.1} far={100} />
    <OrbitControls
      makeDefault
      target={[0, 0.8, 0.8]}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={7}
      maxDistance={19}
      minPolarAngle={0.55}
      maxPolarAngle={1.25}
    />
    <GlbModel url="/assets/models/cafe-shell.glb" />
    <CharacterController />
    <CustomerFlow />
    <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={18} blur={2.2} />
    <Environment preset="apartment" />
  </>
);

export const CafeScene = memo(() => (
  <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance" }}>
    <Suspense fallback={null}>
      <Interior />
    </Suspense>
  </Canvas>
));

stations.forEach(({ model }) => {
  if (model) useGLTF.preload(`/assets/models/${model}`);
});
useGLTF.preload("/assets/models/cafe-shell.glb");
useGLTF.preload("/assets/models/jieun.glb");
useGLTF.preload("/assets/models/customer.glb");
