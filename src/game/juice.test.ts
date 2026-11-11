import { describe, expect, it } from 'vitest'
import { createGame } from './logic.ts'
import { canUndo, castVote, endAwards, firstTap, nextStreak, rpsOutcome, wheelRotation } from './juice.ts'
import type { GameState } from './types.ts'

function game(): GameState {
  return createGame({
    boardSize: 50,
    category: 'family',
    players: [
      { name: 'Bima', avatar: 'cat', color: '#7950F2' },
      { name: 'Sari', avatar: 'rabbit', color: '#FF5C9D' },
    ],
  })
}

describe('interactive extras', () => {
  it('only undoes a later unfinished turn', () => {
    const before = game()
    const after = { ...before, turns: before.turns + 1 }
    expect(canUndo(null, after)).toBe(false)
    expect(canUndo(before, after)).toBe(true)
    expect(canUndo(after, before)).toBe(false)
    expect(canUndo(before, { ...after, phase: 'won' })).toBe(false)
  })

  it('lets other players vote once without changing the score', () => {
    const first = castVote({ ups: [], downs: [], voterId: 'p2', targetId: 'p1', choice: 'up' })
    expect(first.ups).toEqual(['p2'])
    const again = castVote({ ...first, voterId: 'p2', targetId: 'p1', choice: 'down' })
    expect(again).toEqual(first)
    const self = castVote({ ups: [], downs: [], voterId: 'p1', targetId: 'p1', choice: 'up' })
    expect(self.ups).toEqual([])
  })

  it('lands the wheel on the card that was already chosen', () => {
    const truth = wheelRotation('truth') % 360
    const dare = wheelRotation('dare') % 360
    expect(truth).not.toBe(dare)
    expect(truth).toBeGreaterThanOrEqual(0)
    expect(dare).toBeLessThan(360)
  })

  it('resolves rock paper scissors and the first fair tap', () => {
    expect(rpsOutcome('rock', 'scissors')).toBe('a')
    expect(rpsOutcome('paper', 'scissors')).toBe('b')
    expect(rpsOutcome('paper', 'paper')).toBe('tie')
    expect(firstTap([{ id: 'p1', at: 10 }, { id: 'p2', at: 40 }], 20)).toBe('p2')
    expect(firstTap([{ id: 'p1', at: 5 }], 20)).toBeNull()
  })

  it('builds streaks and end-of-game awards from what people actually did', () => {
    expect(nextStreak(2, true)).toBe(3)
    expect(nextStreak(2, false)).toBe(0)
    const state = game()
    state.players[0]!.dares = 2
    state.players[0]!.snakes = 1
    state.players[1]!.truths = 3
    state.players[1]!.ladders = 2
    const awards = endAwards(state.players, { p2: 4 })
    expect(awards.find((award) => award.id === 'brave')?.playerIds).toEqual(['p1'])
    expect(awards.find((award) => award.id === 'honest')?.playerIds).toEqual(['p2'])
    expect(awards.find((award) => award.id === 'cheer')?.playerIds).toEqual(['p2'])
    expect(awards.find((award) => award.id === 'lucky')).toBeUndefined()
  })
})
