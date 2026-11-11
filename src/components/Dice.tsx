import { useEffect, useState } from 'react'
import { cn } from '../utils/cn.ts'

const PIPS: Record<number, Array<[number, number]>> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 1],
    [0, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
}

export function Dice({ value, rolling, label }: { value: number; rolling: boolean; label: string }) {
  const [face, setFace] = useState(value)
  useEffect(() => {
    if (!rolling) {
      setFace(value)
      return
    }
    const id = window.setInterval(() => {
      setFace(1 + Math.floor(Math.random() * 6))
    }, 70)
    return () => window.clearInterval(id)
  }, [rolling, value])

  const pips = PIPS[face] ?? PIPS[1]
  return (
    <div
      className={cn(
        'grid h-[4.5rem] w-[4.5rem] shrink-0 grid-cols-3 grid-rows-3 rounded-2xl border-4 border-ink bg-white p-2 shadow-pop',
        rolling && 'animate-dice',
      )}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: 9 }, (_, index) => {
        const row = Math.floor(index / 3)
        const col = index % 3
        const on = pips.some(([x, y]) => x === col && y === row)
        return (
          <span key={index} className="flex items-center justify-center">
            {on ? <span className="h-2.5 w-2.5 rounded-full bg-ink" /> : null}
          </span>
        )
      })}
    </div>
  )
}
