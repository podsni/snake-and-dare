import { describe, expect, it } from 'vitest'
import { faceUp, throwForce, wantsPhysicsDice } from './diceThrow.ts'

describe('physics dice', () => {
  it('reads the upward face from the die orientation', () => {
    expect(faceUp({ x: 0, y: 0, z: 0, w: 1 })).toBe(3)
    expect(faceUp({ x: 1, y: 0, z: 0, w: 0 })).toBe(4)
  })

  it('uses the 3D die only when WebGL is available and motion is allowed', () => {
    expect(wantsPhysicsDice(true, false)).toBe(true)
    expect(wantsPhysicsDice(true, true)).toBe(false)
    expect(wantsPhysicsDice(false, false)).toBe(false)
  })

  it('charges a harder throw the longer the die is held', () => {
    expect(throwForce(0)).toBeCloseTo(0.28)
    expect(throwForce(800)).toBeCloseTo(1)
    expect(throwForce(400)).toBeGreaterThan(throwForce(0))
    expect(throwForce(5000)).toBeCloseTo(1)
  })
})
