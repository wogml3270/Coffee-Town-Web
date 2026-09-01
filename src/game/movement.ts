export type CafePoint = Readonly<{ x: number; z: number }>;

const playerRadius = 0.38;
const walkBounds = { minX: -5.55, maxX: 5.95, minZ: -2.5, maxZ: 5.05 } as const;
const solidCounters = [
  { minX: 1.2, maxX: 6.5, minZ: 3.075, maxZ: 4.425 },
] as const;

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));
export const isCafePositionBlocked = ({ x, z }: CafePoint) => solidCounters.some((counter) =>
  x > counter.minX - playerRadius && x < counter.maxX + playerRadius && z > counter.minZ - playerRadius && z < counter.maxZ + playerRadius,
);

export const resolveCafeMovement = (current: CafePoint, movement: CafePoint): CafePoint => {
  const nextX = clamp(current.x + movement.x, walkBounds.minX, walkBounds.maxX);
  const xResolved = isCafePositionBlocked({ x: nextX, z: current.z }) ? current.x : nextX;
  const nextZ = clamp(current.z + movement.z, walkBounds.minZ, walkBounds.maxZ);
  const zResolved = isCafePositionBlocked({ x: xResolved, z: nextZ }) ? current.z : nextZ;
  return { x: xResolved, z: zResolved };
};
