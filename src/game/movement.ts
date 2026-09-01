export type CafePoint = Readonly<{ x: number; z: number }>;

const playerRadius = 0.38;
const walkBounds = { minX: -7.55, maxX: 7.55, minZ: -2.7, maxZ: 5.15 } as const;
const solidCounters = [
  { minX: 1.2, maxX: 6.5, minZ: 3.075, maxZ: 4.425 },
  { minX: -4.55, maxX: -2.05, minZ: 1.9, maxZ: 4.25 },
  { minX: -2.25, maxX: 0.25, minZ: 1.9, maxZ: 4.25 },
] as const;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));
export const isCafePositionBlocked = ({ x, z }: CafePoint) =>
  solidCounters.some(
    (counter) =>
      x > counter.minX - playerRadius &&
      x < counter.maxX + playerRadius &&
      z > counter.minZ - playerRadius &&
      z < counter.maxZ + playerRadius,
  );

export const resolveCafeMovement = (current: CafePoint, movement: CafePoint): CafePoint => {
  const nextX = clamp(current.x + movement.x, walkBounds.minX, walkBounds.maxX);
  const currentlyBlocked = isCafePositionBlocked(current);
  const xCandidate = { x: nextX, z: current.z };
  const xResolved = isCafePositionBlocked(xCandidate) && !currentlyBlocked ? current.x : nextX;
  const nextZ = clamp(current.z + movement.z, walkBounds.minZ, walkBounds.maxZ);
  const zCandidate = { x: xResolved, z: nextZ };
  const zResolved = isCafePositionBlocked(zCandidate) && !currentlyBlocked ? current.z : nextZ;
  return { x: xResolved, z: zResolved };
};
