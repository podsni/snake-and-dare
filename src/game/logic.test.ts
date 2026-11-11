import { describe, expect, it } from 'vitest'
import { boardProblems, buildBoard, tileAt, tileCoord } from './board.ts'
import { allCards, cardsFor, drawCard } from './deck.ts'
import {
  applyDice,
  canRoll,
  completeChallenge,
  createGame,
  leaderboard,
  normalizeGame,
  redrawChallenge,
} from './logic.ts'
import type { Board, BoardSize, GameState, Rng, Tile } from './types.ts'

function fresh(size: BoardSize = 100, count = 2, category: GameState['category'] = 'funny'): GameState {
  return createGame({
    boardSize: size,
    category,
    players: Array.from({ length: count }, (_, index) => ({
      name: `P${index + 1}`,
      avatar: 'cat',
      color: '#7950F2',
    })),
  })
}

function at(state: GameState, position: number, index = 0, extra: Partial<GameState['players'][number]> = {}): GameState {
  const next = structuredClone(state)
  const player = next.players[index]
  if (!player) throw new Error('missing player')
  next.players[index] = { ...player, position, ...extra }
  return next
}

function fixed(value: number): Rng {
  return () => value
}

function replaceTile(board: Board, n: number, patch: Partial<Tile>): Board {
  const tiles = board.tiles.map((tile) => (tile.n === n ? { ...tile, ...patch, n } : { ...tile }))
  return { ...board, tiles }
}

describe('zig-zag numbering', () => {
  it('starts at the bottom-left and alternates direction on both boards', () => {
    for (const size of [50, 100] as const) {
      const { cols, rows } = buildBoard(size)
      const seen = new Set<number>()
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const n = tileAt(row, col, size)
          seen.add(n)
          const coord = tileCoord(n, size)
          expect(coord.rowFromTop).toBe(row)
          expect(coord.col).toBe(col)
        }
      }
      expect(seen.size).toBe(size)
      expect(tileAt(rows - 1, 0, size)).toBe(1)
      expect(tileAt(rows - 1, cols - 1, size)).toBe(10)
      expect(tileAt(rows - 2, cols - 1, size)).toBe(11)
      expect(tileAt(rows - 2, 0, size)).toBe(20)
    }
    expect(tileCoord(100, 100)).toMatchObject({ rowFromTop: 0, col: 0 })
    expect(tileCoord(50, 50)).toMatchObject({ rowFromTop: 0, col: 9 })
  })
})

describe('snakes, ladders, and specials', () => {
  it('matches the classic 100-tile portals and keeps every square readable', () => {
    const board = buildBoard(100)
    expect(board.ladders).toEqual([
      { from: 3, to: 22, kind: 'ladder' },
      { from: 8, to: 30, kind: 'ladder' },
      { from: 20, to: 41, kind: 'ladder' },
      { from: 28, to: 55, kind: 'ladder' },
      { from: 44, to: 63, kind: 'ladder' },
      { from: 71, to: 92, kind: 'ladder' },
    ])
    expect(board.snakes).toEqual([
      { from: 27, to: 5, kind: 'snake' },
      { from: 39, to: 17, kind: 'snake' },
      { from: 58, to: 34, kind: 'snake' },
      { from: 67, to: 49, kind: 'snake' },
      { from: 83, to: 61, kind: 'snake' },
      { from: 97, to: 76, kind: 'snake' },
    ])
    expect(boardProblems(board)).toEqual([])
    expect(boardProblems(buildBoard(50))).toEqual([])
    const kinds = board.tiles.map((tile) => tile.kind)
    expect(kinds.filter((kind) => kind === 'truth').length).toBeGreaterThanOrEqual(8)
    expect(kinds.filter((kind) => kind === 'dare').length).toBeGreaterThanOrEqual(8)
    expect(kinds).toContain('lucky')
    expect(kinds).toContain('mystery')
    expect(kinds).toContain('double')
    expect(kinds).toContain('shield')
    expect(board.tiles[99]?.kind).toBe('finish')
    expect(board.tiles[0]?.kind).toBe('normal')
  })

  it('climbs a ladder from the landing tile only', () => {
    const result = applyDice(fresh(), 3, fixed(0))
    expect(result.state.players[0]?.position).toBe(22)
    expect(result.state.players[0]?.ladders).toBe(1)
    expect(result.effects.some((effect) => effect.type === 'ladder' && effect.from === 3 && effect.to === 22)).toBe(true)
    expect(result.state.current).toBe(1)
  })

  it('slides down a snake and then gives the turn away', () => {
    const result = applyDice(at(fresh(), 26), 1, fixed(0))
    expect(result.state.players[0]?.position).toBe(5)
    expect(result.state.players[0]?.snakes).toBe(1)
    expect(result.state.current).toBe(1)
    expect(result.state.phase).toBe('roll')
  })

  it('does not chain a snake into a ladder', () => {
    const board = replaceTile(replaceTile(buildBoard(100), 10, { kind: 'snake', portalTo: 20 }), 20, {
      kind: 'ladder',
      portalTo: 10,
    })
    const started = Date.now()
    const result = applyDice(at(fresh(), 9), 1, fixed(0), board)
    expect(Date.now() - started).toBeLessThan(1000)
    expect(result.state.players[0]?.position).toBe(20)
    expect(result.state.phase).toBe('roll')
  })

  it('ignores events on squares the token only passes through', () => {
    const board = replaceTile(buildBoard(100), 2, { kind: 'truth', portalTo: undefined })
    const result = applyDice(fresh(), 3, fixed(0), board)
    expect(result.state.players[0]?.position).toBe(22)
    expect(result.state.phase).toBe('roll')
    expect(result.state.pendingCardId).toBeNull()
  })
})

describe('exact finish', () => {
  it('wins only on the exact last tile and stays put when the roll would pass it', () => {
    const win = applyDice(at(fresh(), 97), 3, fixed(0))
    expect(win.state.phase).toBe('won')
    expect(win.state.winnerId).toBe('p1')
    expect(win.state.players[0]?.position).toBe(100)
    expect(win.state.players[0]?.score).toBe(50)
    expect(canRoll(win.state)).toBe(false)

    const bounce = applyDice(at(fresh(), 98), 3, fixed(0))
    expect(bounce.state.players[0]?.position).toBe(98)
    expect(bounce.state.players[0]?.score).toBe(0)
    expect(bounce.state.phase).toBe('roll')
    expect(bounce.state.current).toBe(1)
    expect(bounce.effects.some((effect) => effect.type === 'bounce')).toBe(true)

    const short = applyDice(at(fresh(50), 45), 5, fixed(0))
    expect(short.state.phase).toBe('won')
    expect(short.state.players[0]?.position).toBe(50)
    const shortBounce = applyDice(at(fresh(50), 45), 6, fixed(0))
    expect(shortBounce.state.players[0]?.position).toBe(45)
    expect(shortBounce.state.phase).toBe('roll')
  })

  it('gives the win to whoever lands on the last tile, even with a lower score', () => {
    const state = at(fresh(), 98)
    state.players[1]!.score = 200
    state.players[1]!.position = 40
    const result = applyDice(state, 2, fixed(0))
    expect(result.state.winnerId).toBe('p1')
    expect(result.state.players[1]?.score).toBeGreaterThan(result.state.players[0]?.score ?? 0)
    expect(leaderboard(result.state.players)[0]?.id).toBe('p1')
  })
})

describe('special tiles', () => {
  it('opens a truth or dare once, scores a completion, and scores nothing for a skip', () => {
    const truth = applyDice(at(fresh(), 5), 1, fixed(0))
    expect(truth.state.phase).toBe('challenge')
    expect(truth.state.pendingCardId).toMatch(/^t-funny-/)
    expect(truth.state.usedCardIds).not.toContain(truth.state.pendingCardId)
    expect(canRoll(truth.state)).toBe(false)
    expect(applyDice(truth.state, 6, fixed(0)).state).toBe(truth.state)

    const done = completeChallenge(truth.state, 'done')
    expect(done.state.players[0]?.score).toBe(10)
    expect(done.state.players[0]?.truths).toBe(1)
    expect(done.state.usedCardIds).toContain(truth.state.pendingCardId)
    expect(done.state.phase).toBe('roll')
    expect(done.state.current).toBe(1)

    const dare = applyDice(at(fresh(), 9), 1, fixed(0))
    expect(dare.state.pendingCardId).toMatch(/^d-funny-/)
    const skipped = completeChallenge(dare.state, 'skip')
    expect(skipped.state.players[0]?.score).toBe(0)
    expect(skipped.state.players[0]?.skips).toBe(1)
    expect(skipped.state.players[0]?.dares).toBe(0)
  })

  it('lets New Card replace the prompt without repeating it', () => {
    const truth = applyDice(at(fresh(), 5), 1, fixed(0))
    const first = truth.state.pendingCardId
    const redrawn = redrawChallenge(truth.state, fixed(0))
    expect(redrawn.state.pendingCardId).not.toBe(first)
    expect(redrawn.state.usedCardIds).toContain(first)
    expect(redrawn.state.phase).toBe('challenge')
    expect(redrawn.state.current).toBe(0)
  })

  it('awards lucky points and does not open a second event after the bonus steps', () => {
    const shield = applyDice(at(fresh(), 11), 1, fixed(0))
    expect(shield.state.players[0]?.position).toBe(12)
    expect(shield.state.players[0]?.shield).toBe(true)
    expect(shield.state.players[0]?.score).toBe(5)
    expect(shield.state.players[0]?.luckies).toBe(1)

    const steps = applyDice(at(fresh(), 11), 1, fixed(0.9))
    expect(steps.state.players[0]?.position).toBe(15)
    expect(steps.state.phase).toBe('roll')
    expect(steps.state.pendingCardId).toBeNull()
    expect(steps.state.players[0]?.score).toBe(5)
  })

  it('resolves each mystery outcome a single time', () => {
    const forward = applyDice(at(fresh(), 13), 1, fixed(0))
    expect(forward.state.players[0]?.position).toBe(16)
    expect(forward.state.players[0]?.shield).toBe(false)
    expect(forward.state.players[0]?.score).toBe(0)

    const back = applyDice(at(fresh(), 13), 1, fixed(0.2))
    expect(back.state.players[0]?.position).toBe(12)
    expect(back.state.players[0]?.score).toBe(0)
    expect(back.state.phase).toBe('roll')

    const shielded = applyDice(at(fresh(), 13), 1, fixed(0.4))
    expect(shielded.state.players[0]?.position).toBe(14)
    expect(shielded.state.players[0]?.shield).toBe(true)

    const points = applyDice(at(fresh(), 13), 1, fixed(0.6))
    expect(points.state.players[0]?.score).toBe(5)
    expect(points.state.players[0]?.position).toBe(14)

    const extra = applyDice(at(fresh(), 13), 1, fixed(0.8))
    expect(extra.state.rollsLeft).toBe(1)
    expect(extra.state.current).toBe(0)
    expect(extra.effects.some((effect) => effect.type === 'extra_roll')).toBe(true)
  })

  it('grants one extra roll on Double Dice and spends it on the same player', () => {
    const first = applyDice(at(fresh(), 22), 1, fixed(0))
    expect(first.state.players[0]?.position).toBe(23)
    expect(first.state.current).toBe(0)
    expect(first.state.rollsLeft).toBe(1)
    expect(first.effects.some((effect) => effect.type === 'double')).toBe(true)

    const second = applyDice(first.state, 1, fixed(0))
    expect(second.state.players[0]?.position).toBe(24)
    expect(second.state.players[1]?.position).toBe(0)
    expect(second.state.current).toBe(1)
  })

  it('spends a shield on one snake and lets the next snake through', () => {
    const blocked = applyDice(at(fresh(), 26, 0, { shield: true }), 1, fixed(0))
    expect(blocked.state.players[0]?.position).toBe(27)
    expect(blocked.state.players[0]?.shield).toBe(false)
    expect(blocked.state.players[0]?.snakes).toBe(0)

    const gained = applyDice(at(fresh(), 15), 1, fixed(0))
    expect(gained.state.players[0]?.shield).toBe(true)
    expect(gained.state.players[0]?.position).toBe(16)

    const again = structuredClone(blocked.state)
    again.current = 0
    again.rollsLeft = 1
    again.players[0]!.position = 26
    const slide = applyDice(again, 1, fixed(0))
    expect(slide.state.players[0]?.position).toBe(5)
    expect(slide.state.players[0]?.snakes).toBe(1)
  })
})

describe('turn order', () => {
  it('rotates through two to six players and starts the next round on player 1', () => {
    for (const count of [2, 3, 4, 5, 6]) {
      let state = fresh(100, count)
      for (let turn = 0; turn < count; turn += 1) {
        expect(state.current).toBe(turn)
        state = applyDice(state, 1, fixed(0)).state
        expect(state.players[turn]?.position).toBe(1)
      }
      expect(state.current).toBe(0)
      expect(state.round).toBe(2)
    }
  })

  it('rejects a second immediate roll for the same player', () => {
    const first = applyDice(fresh(), 4, fixed(0))
    expect(first.state.players[0]?.position).toBe(4)
    const second = applyDice(first.state, 6, fixed(0))
    expect(second.state.players[0]?.position).toBe(4)
    expect(second.state.players[1]?.position).toBe(6)
  })

  it('rejects invalid player counts and blank names', () => {
    expect(() => fresh(100, 1)).toThrow(/2/)
    expect(() =>
      createGame({
        boardSize: 100,
        category: 'mixed',
        players: [
          { name: 'A', avatar: 'cat', color: '#7950F2' },
          { name: '   ', avatar: 'fox', color: '#FF5C9D' },
        ],
      }),
    ).toThrow(/name/i)
    expect(() =>
      createGame({
        boardSize: 50,
        category: 'family',
        players: [
          { name: 'Name That Is Too Long', avatar: 'cat', color: '#7950F2' },
          { name: 'Bo', avatar: 'owl', color: '#4DABF7' },
        ],
      }),
    ).toThrow(/16/)
  })
})

describe('cards', () => {
  it('ships at least 300 truths and 300 dares, with 60 or more in every category', () => {
    const cards = allCards()
    const truths = cards.filter((card) => card.type === 'truth')
    const dares = cards.filter((card) => card.type === 'dare')
    expect(truths.length).toBeGreaterThanOrEqual(300)
    expect(dares.length).toBeGreaterThanOrEqual(300)
    for (const category of ['funny', 'friendship', 'couple', 'family', 'mixed'] as const) {
      expect(cardsFor('truth', category).length).toBeGreaterThanOrEqual(60)
      expect(cardsFor('dare', category).length).toBeGreaterThanOrEqual(60)
    }
    const ids = new Set(cards.map((card) => card.id))
    const english = new Set(cards.map((card) => card.text.en.trim().toLowerCase()))
    const indonesian = new Set(cards.map((card) => card.text.id.trim().toLowerCase()))
    expect(ids.size).toBe(cards.length)
    expect(english.size).toBe(cards.length)
    expect(indonesian.size).toBe(cards.length)
    for (const card of cards) {
      expect(card.text.en.length).toBeGreaterThan(8)
      expect(card.text.id.length).toBeGreaterThan(8)
      expect(card.text.id).not.toBe(card.text.en)
    }
  })

  it('does not repeat a card until its pool is used up', () => {
    const pool = cardsFor('truth', 'family')
    const used: string[] = []
    const seen = new Set<string>()
    for (let i = 0; i < pool.length; i += 1) {
      const card = drawCard('truth', 'family', used, fixed(0))
      expect(seen.has(card.id)).toBe(false)
      seen.add(card.id)
      used.push(card.id)
    }
    expect(seen.size).toBe(pool.length)
    const recycled = drawCard('truth', 'family', used, fixed(0))
    expect(seen.has(recycled.id)).toBe(true)
    expect(used.length).toBeLessThan(pool.length)
  })
})

describe('save and resume', () => {
  it('round-trips an in-progress challenge and keeps playing from that turn', async () => {
    const { parseSave, serializeSave, writeSave, readSave, clearSave } = await import('../utils/storage.ts')
    const mid = applyDice(at(fresh(50, 3, 'mixed'), 4), 1, fixed(0))
    expect(mid.state.phase).toBe('challenge')
    const memory = memoryStorage()
    const file = {
      version: 1 as const,
      game: mid.state,
      settings: { language: 'id' as const, sfx: false, music: true, volume: 0.4, reduceMotion: true },
      savedAt: 10,
    }
    writeSave(memory, file)
    const loaded = readSave(memory)
    expect(loaded?.game.pendingCardId).toBe(mid.state.pendingCardId)
    expect(loaded?.game.current).toBe(0)
    expect(loaded?.game.players[0]?.position).toBe(5)
    expect(loaded?.settings.language).toBe('id')
    expect(canRoll(loaded!.game)).toBe(false)
    const continued = completeChallenge(loaded!.game, 'done')
    expect(continued.state.players[0]?.truths).toBe(1)
    expect(continued.state.current).toBe(1)
    expect(parseSave('not json')).toBeNull()
    expect(parseSave(serializeSave(file))?.game.boardSize).toBe(50)
    clearSave(memory)
    expect(readSave(memory)).toBeNull()
  })

  it('repairs a challenge that lost its card so the turn can continue', () => {
    const broken = fresh()
    broken.phase = 'challenge'
    broken.pendingCardId = null
    broken.rollsLeft = 0
    const fixedState = normalizeGame(broken)
    expect(fixedState.phase).toBe('roll')
    expect(fixedState.rollsLeft).toBe(1)
    expect(canRoll(fixedState)).toBe(true)
  })
})

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key)
    },
    setItem: (key, value) => {
      map.set(key, value)
    },
  }
}
