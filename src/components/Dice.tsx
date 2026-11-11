import { useEffect, useState } from 'react'
import { cn } from '../utils/cn.ts'

const PIPS: Record<number, Array<[number, number]>> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
}

const FACE_TURN: Record<number, string> = {
  1: 'rotateX(0deg) rotateY(0deg)',
  2: 'rotateY(-90deg)',
  3: 'rotateX(-90deg)',
  4: 'rotateX(90deg)',
  5: 'rotateY(90deg)',
  6: 'rotateY(180deg)',
}

const FACE_PLACE: Record<number, string> = {
  1: 'translateZ(2.25rem)',
  6: 'rotateY(180deg) translateZ(2.25rem)',
  2: 'rotateY(90deg) translateZ(2.25rem)',
  5: 'rotateY(-90deg) translateZ(2.25rem)',
  3: 'rotateX(90deg) translateZ(2.25rem)',
  4: 'rotateX(-90deg) translateZ(2.25rem)',
}

export function Dice({
  value,
  rolling,
  label,
  onRoll,
  disabled = false,
}: {
  value: number
  rolling: boolean
  label: string
  onRoll?: () => void
  disabled?: boolean
}) {
  const [face, setFace] = useState(value)
  useEffect(() => {
    if (!rolling) {
      setFace(value)
      return
    }
    const id = window.setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), 80)
    return () => window.clearInterval(id)
  }, [rolling, value])

  const shown = rolling ? face : value
  const cube = (
    <div
      className={cn('dice-cube', rolling && 'dice-tumble')}
      style={rolling ? undefined : { transform: FACE_TURN[shown] ?? FACE_TURN[1] }}
    >
      {[1, 2, 3, 4, 5, 6].map((side) => (
        <div key={side} className="dice-face" style={{ transform: FACE_PLACE[side] }} aria-hidden>
          {Array.from({ length: 9 }, (_, index) => {
            const row = Math.floor(index / 3)
            const col = index % 3
            const on = (PIPS[side] ?? []).some(([x, y]) => x === col && y === row)
            return <span key={index} className={on ? '' : 'bg-transparent'} style={on ? undefined : { background: 'transparent' }} />
          })}
        </div>
      ))}
    </div>
  )

  if (!onRoll) {
    return (
      <div className="dice-scene" role="img" aria-label={label}>
        {cube}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="dice-scene rounded-2xl disabled:opacity-50"
      aria-label={label}
      onClick={onRoll}
      disabled={disabled}
    >
      {cube}
    </button>
  )
}
