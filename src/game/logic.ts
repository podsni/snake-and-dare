import { buildBoard } from './board.ts'
import { cardById, drawCard } from './deck.ts'
import type {
  Board,
  BoardSize,
  Category,
  Effect,
  GameState,
  PlayerDraft,
  PlayerState,
  Rng,
} from './types.ts'
import { AVATAR_IDS, PLAYER_COLORS } from './types.ts'

export interface RollResult {
  state: GameState
  effects: Effect[]
}

const MYSTERY_MODES = ['forward2', 'back2', 'shield', 'points', 'extra_roll'] as const

export function makeRng(seed: number): Rng {
  let value = seed >>> 0
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 4294967296
  }
}

export function rollD6(rng: Rng): number {
  return 1 + Math.floor(rng() * 6)
}

function blankPlayer(draft: PlayerDraft, index: number): PlayerState {
  const name = draft.name.trim()
  return {
    id: `p${index + 1}`,
    name,
    avatar: draft.avatar,
    color: draft.color,
    position: 0,
    score: 0,
    shield: false,
    truths: 0,
    dares: 0,
    skips: 0,
    snakes: 0,
    ladders: 0,
    luckies: 0,
  }
}

export function createGame(options: {
  players: PlayerDraft[]
  boardSize: BoardSize
  category: Category
}): GameState {
  const { players, boardSize, category } = options
  if (players.length < 2 || players.length > 6) {
    throw new Error('Player count must be between 2 and 6')
  }
  for (const player of players) {
    const name = player.name.trim()
    if (!name) throw new Error('Every player needs a name')
    if (name.length > 16) throw new Error('Names can be at most 16 characters')
  }
  return {
    boardSize,
    category,
    players: players.map(blankPlayer),
    current: 0,
    rollsLeft: 1,
    phase: 'roll',
    winnerId: null,
    usedCardIds: [],
    pendingCardId: null,
    round: 1,
    turns: 0,
  }
}

export function defaultDraft(count: number, language: 'en' | 'id' = 'en'): PlayerDraft[] {
  const total = Math.min(6, Math.max(2, count))
  return Array.from({ length: total }, (_, index) => ({
    name: language === 'id' ? `Pemain ${index + 1}` : `Player ${index + 1}`,
    avatar: AVATAR_IDS[index % AVATAR_IDS.length] ?? 'cat',
    color: PLAYER_COLORS[index % PLAYER_COLORS.length] ?? '#7950F2',
  }))
}

export function canRoll(state: GameState): boolean {
  return state.phase === 'roll' && state.rollsLeft > 0 && state.winnerId === null
}

export function leaderboard(players: PlayerState[]): PlayerState[] {
  return [...players].sort(
    (a, b) => b.position - a.position || b.score - a.score || a.name.localeCompare(b.name),
  )
}

function clone(state: GameState): GameState {
  return structuredClone(state)
}

function current(state: GameState): PlayerState {
  const player = state.players[state.current]
  if (!player) throw new Error('Missing current player')
  return player
}

function awardWin(state: GameState, effects: Effect[]): void {
  if (state.phase === 'won') return
  const player = current(state)
  player.position = state.boardSize
  player.score += 50
  state.phase = 'won'
  state.winnerId = player.id
  state.rollsLeft = 0
  state.pendingCardId = null
  effects.push({ type: 'score', amount: 50, reason: 'finish' })
  effects.push({ type: 'win', playerId: player.id })
}

function finishTurn(state: GameState, effects: Effect[]): void {
  if (state.phase === 'challenge' || state.phase === 'won') return
  if (state.rollsLeft > 0) {
    effects.push({ type: 'extra_roll' })
    return
  }
  const count = state.players.length
  state.current = (state.current + 1) % count
  state.rollsLeft = 1
  if (state.current === 0) state.round += 1
  effects.push({ type: 'turn', playerIndex: state.current })
}

/** One portal only. Landing on the far side of a snake or ladder does not chain. */
function applyPortal(state: GameState, board: Board, effects: Effect[]): void {
  const player = current(state)
  if (player.position <= 0 || player.position >= state.boardSize) return
  const tile = board.tiles[player.position - 1]
  if (!tile || (tile.kind !== 'snake' && tile.kind !== 'ladder') || tile.portalTo == null) return
  if (tile.kind === 'snake') {
    if (player.shield) {
      player.shield = false
      effects.push({ type: 'shield_block', tile: player.position })
      return
    }
    const from = player.position
    player.position = tile.portalTo
    player.snakes += 1
    effects.push({ type: 'snake', from, to: tile.portalTo })
    if (player.position === state.boardSize) awardWin(state, effects)
    return
  }
  const from = player.position
  player.position = tile.portalTo
  player.ladders += 1
  effects.push({ type: 'ladder', from, to: tile.portalTo })
  if (player.position === state.boardSize) awardWin(state, effects)
}

function moveBy(state: GameState, steps: number, effects: Effect[], dice: boolean): 'moved' | 'bounce' | 'win' {
  const player = current(state)
  const target = player.position + steps
  if (target > state.boardSize) {
    if (dice) effects.push({ type: 'bounce', roll: steps, position: player.position })
    return 'bounce'
  }
  const path: number[] = []
  for (let tile = player.position + 1; tile <= target; tile += 1) path.push(tile)
  player.position = target
  effects.push({ type: 'move', path })
  if (target === state.boardSize) {
    awardWin(state, effects)
    return 'win'
  }
  return 'moved'
}

function moveBack(state: GameState, steps: number, board: Board, effects: Effect[]): void {
  const player = current(state)
  const dest = Math.max(0, player.position - steps)
  if (dest === player.position) return
  const path: number[] = []
  for (let tile = player.position - 1; tile >= dest; tile -= 1) path.push(tile)
  player.position = dest
  effects.push({ type: 'move', path })
  if (dest > 0) applyPortal(state, board, effects)
}

function resolveSpecial(state: GameState, board: Board, effects: Effect[], rng: Rng): void {
  if (state.phase === 'won') return
  const player = current(state)
  const tile = board.tiles[player.position - 1]
  if (!tile) return
  switch (tile.kind) {
    case 'truth':
    case 'dare': {
      const card = drawCard(tile.kind, state.category, state.usedCardIds, rng)
      state.phase = 'challenge'
      state.pendingCardId = card.id
      effects.push({ type: 'challenge', cardId: card.id, kind: tile.kind })
      return
    }
    case 'lucky': {
      player.score += 5
      player.luckies += 1
      effects.push({ type: 'score', amount: 5, reason: 'lucky' })
      if (rng() < 0.5) {
        player.shield = true
        effects.push({ type: 'lucky', mode: 'shield' })
        effects.push({ type: 'shield_gain' })
        return
      }
      if (player.position + 3 > state.boardSize) {
        effects.push({ type: 'lucky', mode: 'blocked_steps' })
        return
      }
      effects.push({ type: 'lucky', mode: 'steps' })
      const moved = moveBy(state, 3, effects, false)
      if (moved === 'moved') applyPortal(state, board, effects)
      return
    }
    case 'mystery': {
      const index = Math.min(MYSTERY_MODES.length - 1, Math.floor(rng() * MYSTERY_MODES.length))
      const mode = MYSTERY_MODES[index] ?? 'points'
      effects.push({ type: 'mystery', mode })
      if (mode === 'shield') {
        player.shield = true
        effects.push({ type: 'shield_gain' })
      } else if (mode === 'points') {
        player.score += 5
        effects.push({ type: 'score', amount: 5, reason: 'mystery' })
      } else if (mode === 'extra_roll') {
        state.rollsLeft += 1
      } else if (mode === 'forward2') {
        if (player.position + 2 <= state.boardSize) {
          const moved = moveBy(state, 2, effects, false)
          if (moved === 'moved') applyPortal(state, board, effects)
        }
      } else {
        moveBack(state, 2, board, effects)
      }
      return
    }
    case 'double': {
      state.rollsLeft += 1
      effects.push({ type: 'double' })
      return
    }
    case 'shield': {
      player.shield = true
      effects.push({ type: 'shield_gain' })
      return
    }
    default:
      return
  }
}

export function applyDice(state: GameState, roll: number, rng: Rng, board?: Board): RollResult {
  if (!canRoll(state)) return { state, effects: [] }
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) return { state, effects: [] }
  const active = board ?? buildBoard(state.boardSize)
  if (active.size !== state.boardSize) return { state, effects: [] }

  const next = clone(state)
  const effects: Effect[] = [{ type: 'roll', value: roll }]
  next.rollsLeft -= 1
  next.turns += 1
  const moved = moveBy(next, roll, effects, true)
  if (moved === 'moved') {
    applyPortal(next, active, effects)
    if (next.phase !== 'won') resolveSpecial(next, active, effects, rng)
  }
  if (next.phase !== 'won') finishTurn(next, effects)
  return { state: next, effects }
}

export function completeChallenge(state: GameState, action: 'done' | 'skip'): RollResult {
  if (state.phase !== 'challenge' || !state.pendingCardId) return { state, effects: [] }
  const next = clone(state)
  const effects: Effect[] = []
  const cardId = next.pendingCardId
  const card = cardId ? cardById(cardId) : undefined
  if (cardId && !next.usedCardIds.includes(cardId)) next.usedCardIds.push(cardId)
  const player = current(next)
  if (action === 'done' && card) {
    if (card.type === 'truth') {
      player.score += 10
      player.truths += 1
      effects.push({ type: 'score', amount: 10, reason: 'truth' })
    } else {
      player.score += 15
      player.dares += 1
      effects.push({ type: 'score', amount: 15, reason: 'dare' })
    }
  } else {
    player.skips += 1
    effects.push({ type: 'skip' })
  }
  next.pendingCardId = null
  next.phase = 'roll'
  finishTurn(next, effects)
  return { state: next, effects }
}

export function redrawChallenge(state: GameState, rng: Rng): RollResult {
  if (state.phase !== 'challenge' || !state.pendingCardId) return { state, effects: [] }
  const next = clone(state)
  const previousId = next.pendingCardId
  const previous = previousId ? cardById(previousId) : undefined
  if (!previous || !previousId) return { state, effects: [] }
  if (!next.usedCardIds.includes(previousId)) next.usedCardIds.push(previousId)
  const card = drawCard(previous.type, next.category, next.usedCardIds, rng, previousId)
  next.pendingCardId = card.id
  return {
    state: next,
    effects: [{ type: 'challenge', cardId: card.id, kind: card.type }],
  }
}

export function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false
  const state = value as GameState
  if (state.boardSize !== 50 && state.boardSize !== 100) return false
  if (!Array.isArray(state.players) || state.players.length < 2 || state.players.length > 6) return false
  if (state.phase !== 'roll' && state.phase !== 'challenge' && state.phase !== 'won') return false
  if (!Number.isInteger(state.current) || state.current < 0 || state.current >= state.players.length) return false
  if (!Number.isInteger(state.rollsLeft) || state.rollsLeft < 0) return false
  if (!Array.isArray(state.usedCardIds)) return false
  if (typeof state.round !== 'number' || typeof state.turns !== 'number') return false
  const categories = ['funny', 'friendship', 'couple', 'family', 'mixed']
  if (!categories.includes(state.category)) return false
  return state.players.every(
    (player) =>
      !!player &&
      typeof player.id === 'string' &&
      typeof player.name === 'string' &&
      typeof player.position === 'number' &&
      typeof player.score === 'number' &&
      typeof player.shield === 'boolean',
  )
}

export function normalizeGame(state: GameState): GameState {
  const next = clone(state)
  next.current = Math.min(next.players.length - 1, Math.max(0, next.current))
  for (const player of next.players) {
    player.position = Math.min(next.boardSize, Math.max(0, Math.round(player.position)))
    player.score = Math.max(0, Math.round(player.score))
  }
  if (next.phase === 'challenge' && !next.pendingCardId) next.phase = 'roll'
  if (next.phase === 'won') {
    next.rollsLeft = 0
    return next
  }
  if (next.phase === 'roll' && next.rollsLeft === 0) next.rollsLeft = 1
  return next
}
