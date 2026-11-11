import { CARDS } from '../data/cards.ts'
import type { Card, CardType, Category, Rng } from './types.ts'

const BY_ID = new Map(CARDS.map((card) => [card.id, card]))

export function allCards(): readonly Card[] {
  return CARDS
}

export function cardById(id: string): Card | undefined {
  return BY_ID.get(id)
}

export function cardsFor(type: CardType, category: Category): Card[] {
  return CARDS.filter((card) => card.type === type && card.category === category)
}

/**
 * Draw a card from the matching pool. Used cards are skipped until that pool
 * is empty, then it recycles. `excludeId` stays out of the draw when any
 * other card is available, so New Card does not repeat the one on screen.
 * The usedIds array is updated when a recycle happens.
 */
export function drawCard(
  type: CardType,
  category: Category,
  usedIds: string[],
  rng: Rng,
  excludeId?: string,
): Card {
  const matches = (card: Card) => card.type === type && card.category === category
  const poolOf = () => CARDS.filter((card) => matches(card) && !usedIds.includes(card.id) && card.id !== excludeId)

  let pool = poolOf()
  if (pool.length === 0) {
    for (let i = usedIds.length - 1; i >= 0; i -= 1) {
      const card = BY_ID.get(usedIds[i] ?? '')
      if (card && matches(card)) usedIds.splice(i, 1)
    }
    const matching = CARDS.filter(matches)
    if (excludeId && matching.length > 1) usedIds.push(excludeId)
    pool = poolOf()
    if (pool.length === 0) pool = matching
  }
  if (pool.length === 0) {
    throw new Error(`No ${type} cards for ${category}`)
  }
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(rng() * pool.length)))
  const card = pool[index]
  if (!card) throw new Error('Card pool miss')
  return card
}

export function remainingCards(type: CardType, category: Category, usedIds: string[]): number {
  return cardsFor(type, category).filter((card) => !usedIds.includes(card.id)).length
}
