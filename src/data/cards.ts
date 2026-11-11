import type { Card, CardType, Category } from '../game/types.ts'
import { COUPLE_DARES, COUPLE_TRUTHS } from './deck/couple.ts'
import { FAMILY_DARES, FAMILY_TRUTHS } from './deck/family.ts'
import { FRIENDSHIP_DARES, FRIENDSHIP_TRUTHS } from './deck/friendship.ts'
import { FUNNY_DARES, FUNNY_TRUTHS } from './deck/funny.ts'
import { MIXED_DARES, MIXED_TRUTHS } from './deck/mixed.ts'

type Row = [Category, string, string]

const TRUTHS: Row[] = [
  ...FUNNY_TRUTHS,
  ...FRIENDSHIP_TRUTHS,
  ...COUPLE_TRUTHS,
  ...FAMILY_TRUTHS,
  ...MIXED_TRUTHS,
]

const DARES: Row[] = [
  ...FUNNY_DARES,
  ...FRIENDSHIP_DARES,
  ...COUPLE_DARES,
  ...FAMILY_DARES,
  ...MIXED_DARES,
]

function pack(type: CardType, rows: Row[]): Card[] {
  const counts: Record<string, number> = {}
  return rows.map(([category, en, id]) => {
    counts[category] = (counts[category] ?? 0) + 1
    const n = String(counts[category]).padStart(2, '0')
    const prefix = type === 'truth' ? 't' : 'd'
    return {
      id: `${prefix}-${category}-${n}`,
      type,
      category,
      text: { en, id },
    }
  })
}

export const CARDS: Card[] = [...pack('truth', TRUTHS), ...pack('dare', DARES)]
