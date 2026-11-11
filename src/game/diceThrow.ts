export type Quat = { x: number; y: number; z: number; w: number }

/** Local face normals for a standard cube. +Y is up in the scene. */
const FACES: { value: number; normal: [number, number, number] }[] = [
  { value: 1, normal: [0, 0, 1] },
  { value: 6, normal: [0, 0, -1] },
  { value: 3, normal: [0, 1, 0] },
  { value: 4, normal: [0, -1, 0] },
  { value: 2, normal: [1, 0, 0] },
  { value: 5, normal: [-1, 0, 0] },
]

export function rotateByQuat(q: Quat, v: [number, number, number]): [number, number, number] {
  const { x, y, z, w } = q
  const [vx, vy, vz] = v
  const tx = 2 * (y * vz - z * vy)
  const ty = 2 * (z * vx - x * vz)
  const tz = 2 * (x * vy - y * vx)
  return [
    vx + w * tx + (y * tz - z * ty),
    vy + w * ty + (z * tx - x * tz),
    vz + w * tz + (x * ty - y * tx),
  ]
}

/** Which numbered face points up. The mesh quaternion is inverted relative to outward normals. */
export function faceUp(q: Quat): number {
  const turned = { x: -q.x, y: -q.y, z: -q.z, w: q.w }
  let best = 1
  let bestDot = -Infinity
  for (const face of FACES) {
    const normal = rotateByQuat(turned, face.normal)
    if (normal[1] > bestDot) {
      bestDot = normal[1]
      best = face.value
    }
  }
  return best
}

export function wantsPhysicsDice(webgl: boolean, reduceMotion: boolean): boolean {
  return webgl && !reduceMotion
}

/** 0.28 for a tap, up to 1 after a long hold. */
export function throwForce(holdMs: number): number {
  const held = Math.min(1, Math.max(0, holdMs) / 800)
  return 0.28 + held * 0.72
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
