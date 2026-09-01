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
  { id: "water", model: "water-dispenser.glb", position: [0.25, 1.26, -3.72], scale: 0.66 },
  {
    id: "sparkling",
    model: "sparkling-machine.glb",
    position: [1.65, 1.26, -3.72],
    scale: 0.58,
    minStage: 5,
  },
  { id: "fridge", model: "ingredient-fridge.glb", position: [5.55, 0, -3.9], scale: 0.9 },
  {
    id: "ice",
    model: "ice-machine.glb",
    position: [2.75, 1.26, -3.72],
    scale: 0.66,
    minStage: 1,
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
  { id: "serve", model: "pickup-bell.glb", position: [1.55, 1.26, 3.55], scale: 0.5 },
];

const layoutOffsets = [
  [0, 0],
  [0.16, 0.02],
  [-0.18, 0.05],
  [0.28, -0.04],
  [-0.3, 0.03],
  [0.1, 0.08],
  [-0.08, -0.07],
  [0.24, 0.07],
  [-0.26, -0.05],
  [0.34, 0.01],
  [-0.12, 0.1],
  [0.06, -0.1],
] as const;
const stationsForStage = (stageId: number): readonly StationPlacement[] => {
  const [globalX, globalZ] = layoutOffsets[(stageId - 1) % layoutOffsets.length]!;
  return stations.map((placement, index) => ({
    ...placement,
    position: [
      placement.position[0] + globalX + (((index + stageId) % 3) - 1) * 0.12,
      placement.position[1],
      placement.position[2] + globalZ,
    ],
  }));
};
const diningForStage = (stageId: number) => {
  const variant = stageId - 1;
  const xShift = ((variant % 4) - 1.5) * 0.12;
  const zShift = (Math.floor(variant / 4) - 1) * 0.12;
  const angle = ((variant % 3) - 1) * 0.06;
  return [
    [-3.3 + xShift, 3.2 + zShift, angle],
    [-1.15 - xShift * 0.5, 3.2 - zShift, -angle],
  ] as const;
};

const StageFurniture = ({ stageId }: Readonly<{ stageId: number }>) => (
  <>
    {diningForStage(stageId).map(([x, z, rotation], index) => (
      <group key={index} position={[x, 0, z]} rotation={[0, rotation, 0]}>
        <GlbModel url="/assets/models/dining-set.glb" />
      </group>
    ))}
  </>
);

const EntranceDoors = () => (
  <>
    <group position={[-8.62, 0, 3.85]} rotation={[0, Math.PI / 2, 0]}>
      <GlbModel url="/assets/models/cafe-door.glb" scale={0.82} />
      <Html center position={[0, 2.55, 0]} zIndexRange={[5, 0]} className="door-label exit">
        출구 · EXIT
      </Html>
    </group>
    <group position={[8.62, 0, 3.85]} rotation={[0, -Math.PI / 2, 0]}>
      <GlbModel url="/assets/models/cafe-door.glb" scale={0.82} />
      <Html center position={[0, 2.55, 0]} zIndexRange={[5, 0]} className="door-label entrance">
        입구 · ENTRANCE
      </Html>
    </group>
  </>
);

const clampDestination = (point: THREE.Vector3) =>
  point.set(THREE.MathUtils.clamp(point.x, -7.55, 7.55), 0, THREE.MathUtils.clamp(point.z, -2.7, 5.15));

const GlbModel = ({ url, scale = 1 }: Readonly<{ url: string; scale?: number }>) => {
  const gltf = useGLTF(url);
  return <Clone object={gltf.scene} scale={scale} castShadow receiveShadow />;
};
const CustomerModel = ({ variant }: Readonly<{ variant: number }>) => (
  <GlbModel url={`/assets/models/customer-${String((variant % 6) + 1).padStart(2, "0")}.glb`} scale={0.72} />
);

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
        <Html
          center
          position={[0, -0.32, 0.78]}
          zIndexRange={[5, 0]}
          className={`world-label ${near ? "near" : ""}`}
        >
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
    const focus = new THREE.Vector3(
      THREE.MathUtils.clamp(current.x, -1.6, 1.6),
      0,
      THREE.MathUtils.clamp(current.z, -0.6, 2.15),
    );
    const orbit = controls as { target?: THREE.Vector3; update?: () => void } | null;
    if (!current || !orbit?.target) return;
    if (!initialized.current) {
      const shift = new THREE.Vector3(focus.x, 0.8, focus.z).sub(orbit.target);
      camera.position.add(shift);
      orbit.target.add(shift);
      previous.current.copy(focus);
      initialized.current = true;
    } else {
      const shift = focus.clone().sub(previous.current);
      camera.position.add(shift);
      orbit.target.add(shift);
      previous.current.copy(focus);
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
  const selectedUid = useGame(({ selectedUid }) => selectedUid);
  const discard = useGame(({ discard }) => discard);
  const activeWork = useGame(({ shift }) => shift.activeWork);
  const fever = useGame(({ shift }) => shift.fever);
  const stageId = useGame(({ shift }) => shift.stageId);
  const orderSequence = useGame(({ shift }) => shift.orderSequence);
  const fridgeOpen = useGame(({ fridgeOpen }) => fridgeOpen);
  const waterOpen = useGame(({ waterOpen }) => waterOpen);
  const movementLevel = useGame(({ upgrades }) => upgrades.movement);
  const setNearbyStation = useGame(({ setNearbyStation }) => setNearbyStation);
  const root = useRef<THREE.Group>(null);
  const keys = useRef(new Set<string>());
  const position = useRef(new THREE.Vector3(0, 0, 0.45));
  const destination = useRef<THREE.Vector3 | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const limbs = useRef<{ legs: THREE.Object3D[]; arms: THREE.Object3D[] } | null>(null);
  const feverEffect = useRef<THREE.Group>(null);
  const [near, setNear] = useState<StationId | null>(null);
  const [speech, setSpeech] = useState<string | null>(null);
  const previousOrder = useRef(orderSequence);
  const staffLines = [
    "음료 나왔습니다!",
    "맛있게 드세요!",
    "주문하신 음료 준비됐습니다.",
    "기다려 주셔서 감사합니다.",
    "정성껏 준비했습니다!",
    "좋은 하루 보내세요!",
    "향긋한 음료 나왔습니다.",
    "편안하게 즐겨 주세요.",
    "천천히 즐겨 주세요!",
    "기분 좋은 한 잔 되세요!",
  ];

  useEffect(() => {
    if (orderSequence <= previousOrder.current) return;
    previousOrder.current = orderSequence;
    setSpeech(staffLines[Math.floor(Math.random() * staffLines.length)] ?? "음료 나왔습니다!");
    const timeout = window.setTimeout(() => setSpeech(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [orderSequence]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (fridgeOpen || waterOpen) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      keys.current.add(event.key.toLowerCase());
      if ((event.key === "Backspace" || event.key === "Delete") && selectedUid) {
        event.preventDefault();
        discard(selectedUid);
        return;
      }
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
  }, [combine, discard, fridgeOpen, interact, inventory, near, select, selectedUid, waterOpen]);
  useEffect(() => {
    if (fridgeOpen || waterOpen) {
      keys.current.clear();
      destination.current = null;
    }
  }, [fridgeOpen, waterOpen]);
  useEffect(() => {
    if (activeWork) destination.current = null;
  }, [activeWork]);

  useFrame(({ camera, clock }, delta) => {
    const movementLocked = fridgeOpen || waterOpen || (Boolean(activeWork) && !fever);
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
        const target = stationsForStage(stageId).find(({ id }) => id === activeWork);
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
    for (const placement of stationsForStage(stageId)) {
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
    if (!fridgeOpen && !waterOpen && (!activeWork || fever))
      destination.current = clampDestination(event.point.clone());
  };

  return (
    <>
      <mesh
        position={[0.2, 0.035, 0.75]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={beginPointer}
        onPointerUp={finishPointer}
      >
        <planeGeometry args={[16.5, 8.7]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={root} position={[0, 0, 0.45]}>
        <GlbModel url="/assets/models/jieun.glb" scale={0.82} />
        {speech ? (
          <Html center position={[0, 2.15, 0]} zIndexRange={[5, 0]} className="character-speech">
            {speech}
          </Html>
        ) : null}
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
      {stationsForStage(stageId)
        .filter(({ minStage = 1 }) => minStage <= stageId)
        .map((placement) => (
          <Station key={placement.id} placement={placement} near={near === placement.id} />
        ))}
    </>
  );
};

type ServedGuest = Readonly<{ id: number; seatIndex: number; speech: string }>;

const ServedCustomer = ({
  guest,
  stageId,
  onDone,
}: Readonly<{ guest: ServedGuest; stageId: number; onDone: (id: number) => void }>) => {
  const root = useRef<THREE.Group>(null);
  const phase = useRef<"toSeat" | "drink" | "exit">("toSeat");
  const position = useRef(new THREE.Vector3(4.65, 0, 4.82));
  const phaseStarted = useRef(0);
  const waypoint = useRef(0);
  const cup = useRef<THREE.Group>(null);
  const [showSpeech, setShowSpeech] = useState(true);
  const table = diningForStage(stageId)[guest.seatIndex % 2]!;
  const farSide = guest.seatIndex >= 2;
  const seat = [table[0], table[1] + (farSide ? 0.93 : -0.93)] as const;
  useFrame(({ clock }, delta) => {
    if (!root.current) return;
    const moveTo = (x: number, z: number, speed: number) => {
      const target = new THREE.Vector3(x, 0, z);
      const direction = target.sub(position.current);
      const distance = direction.length();
      if (distance <= 0.08) return true;
      position.current.add(direction.normalize().multiplyScalar(Math.min(distance, delta * speed)));
      root.current!.rotation.y = Math.atan2(direction.x, direction.z);
      return false;
    };
    if (phase.current === "toSeat") {
      const route = [
        [0.45, 4.82],
        [0.45, farSide ? 4.45 : 1.0],
        [seat[0], farSide ? 4.45 : 1.0],
        [seat[0], seat[1]],
      ] as const;
      const target = route[waypoint.current];
      if (target && moveTo(target[0], target[1], 1.65)) waypoint.current += 1;
      if (waypoint.current >= route.length) {
        phase.current = "drink";
        phaseStarted.current = clock.elapsedTime;
        setShowSpeech(false);
      }
    } else if (phase.current === "drink") {
      root.current.rotation.y = farSide ? Math.PI : 0;
      if (clock.elapsedTime - phaseStarted.current > 18 + (guest.id % 4) * 2) {
        phase.current = "exit";
        waypoint.current = 0;
      }
    } else if (phase.current === "exit") {
      const route = [
        [seat[0], farSide ? 4.45 : 1.0],
        [-5.75, farSide ? 4.45 : 1.0],
        [-8.45, 3.85],
      ] as const;
      const target = route[waypoint.current];
      if (target && moveTo(target[0], target[1], 1.9)) waypoint.current += 1;
      if (waypoint.current >= route.length) {
        onDone(guest.id);
      }
    }
    const seated = phase.current === "drink";
    root.current.position.set(
      position.current.x,
      seated ? -0.35 : Math.abs(Math.sin(clock.elapsedTime * 5)) * 0.035,
      position.current.z,
    );
    if (cup.current) {
      cup.current.visible = seated;
      cup.current.position.y = 1.25 + Math.sin(clock.elapsedTime * 5) * 0.08;
      cup.current.rotation.z = seated ? -0.25 + Math.sin(clock.elapsedTime * 3) * 0.12 : 0;
    }
  });
  return (
    <group ref={root} position={[4.65, 0, 4.82]}>
      <CustomerModel variant={guest.id} />
      <group ref={cup} visible={false} position={[0.35, 1.25, 0.25]}>
        <mesh>
          <cylinderGeometry args={[0.13, 0.1, 0.24, 16]} />
          <meshStandardMaterial color="#f4e8cf" />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.105, 0.105, 0.018, 16]} />
          <meshStandardMaterial color="#6c3d25" />
        </mesh>
      </group>
      {showSpeech ? (
        <Html center position={[0, 2.25, 0]} zIndexRange={[5, 0]} className="character-speech customer">
          {guest.speech}
        </Html>
      ) : null}
    </group>
  );
};

const CustomerFlow = () => {
  const orderSequence = useGame(({ shift }) => shift.orderSequence);
  const orders = useGame(({ shift }) => shift.orders);
  const stageId = useGame(({ shift }) => shift.stageId);
  const previous = useRef(orderSequence);
  const [servedGuests, setServedGuests] = useState<readonly ServedGuest[]>([]);
  const customerLines = [
    "감사합니다!",
    "잘 마시겠습니다.",
    "향이 정말 좋네요!",
    "기다린 보람이 있네요.",
    "오늘도 맛있어 보여요!",
    "정성껏 만들어 주셨네요.",
    "좋은 하루 보내세요!",
    "제가 좋아하는 음료예요.",
    "천천히 잘 마실게요.",
    "기분 좋게 잘 마실게요!",
  ];
  useEffect(() => {
    if (orderSequence <= previous.current) return;
    previous.current = orderSequence;
    setServedGuests((current) => {
      const occupied = new Set(current.map(({ seatIndex }) => seatIndex));
      const seatIndex = [0, 1, 2, 3].find((index) => !occupied.has(index)) ?? current.length % 4;
      return [
        ...current,
        {
          id: orderSequence,
          seatIndex,
          speech: customerLines[Math.floor(Math.random() * customerLines.length)] ?? "감사합니다!",
        },
      ];
    });
  }, [orderSequence]);
  return (
    <>
      {orders.map((order, index) => (
        <group key={order.id} position={[4.65 + index * 1.3, 0, 4.82]} rotation={[0, -Math.PI / 2, 0]}>
          <CustomerModel variant={order.id} />
          <Html center position={[0, 2.35, 0]} zIndexRange={[5, 0]} className="customer-order queued">
            <small>{index ? `NEXT ${index + 1}` : "ORDER"}</small>
            <b>{order.name}</b>
          </Html>
        </group>
      ))}
      {servedGuests.map((guest) => (
        <ServedCustomer
          key={guest.id}
          guest={guest}
          stageId={stageId}
          onDone={(id) => setServedGuests((current) => current.filter((entry) => entry.id !== id))}
        />
      ))}
    </>
  );
};

const Interior = () => {
  const stageId = useGame(({ shift }) => shift.stageId);
  const shell = `/assets/models/cafe-shell-stage-${String(stageId).padStart(2, "0")}.glb`;
  return (
    <>
      <color attach="background" args={["#ead7b5"]} />
      <ambientLight intensity={1.45} />
      <directionalLight position={[5, 10, 6]} intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} />
      <PerspectiveCamera makeDefault position={[8.7, 7.8, 11.4]} fov={38} near={0.1} far={100} />
      <OrbitControls
        makeDefault
        target={[0, 0.8, 0.8]}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={8.5}
        maxDistance={15.5}
        minPolarAngle={0.55}
        maxPolarAngle={1.25}
      />
      <GlbModel url={shell} />
      <StageFurniture stageId={stageId} />
      <EntranceDoors />
      <CharacterController />
      <CustomerFlow />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={18} blur={2.2} />
      <Environment preset="apartment" />
    </>
  );
};

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
for (let stage = 1; stage <= 12; stage += 1)
  useGLTF.preload(`/assets/models/cafe-shell-stage-${String(stage).padStart(2, "0")}.glb`);
useGLTF.preload("/assets/models/jieun.glb");
useGLTF.preload("/assets/models/customer.glb");
Array.from({ length: 6 }, (_, index) =>
  useGLTF.preload(`/assets/models/customer-${String(index + 1).padStart(2, "0")}.glb`),
);
useGLTF.preload("/assets/models/dining-set.glb");
useGLTF.preload("/assets/models/cafe-door.glb");
