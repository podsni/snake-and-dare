export function buzz(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    /* some browsers throw if vibration is blocked */
  }
}

export async function enableShake(): Promise<boolean> {
  try {
    const motion = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }
    if (typeof motion.requestPermission === 'function') {
      const result = await motion.requestPermission()
      return result === 'granted'
    }
    return typeof window !== 'undefined' && 'DeviceMotionEvent' in window
  } catch {
    return false
  }
}
