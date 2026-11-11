import type { GameState, PlayerState } from './types.ts'

export type Hand = 'rock' | 'paper' | 'scissors'
export type AwardId = 'brave' | 'honest' | 'lucky' | 'snake' | 'ladder' | 'cheer'

export interface Award {
  id: AwardId
  playerIds: string[]
}

export function nextStreak(current: number, completed: boolean): number {
  return completed ? current + 1 : 0
}

export function canUndo(previous: GameState | null, current: GameState | null): boolean {
  if (!previous || !current) return false
  if (current.phase === 'won' || previous.phase === 'won') return false
  return current.turns > previous.turns
}

export function castVote(input: {
  ups: string[]
  downs: string[]
  voterId: string
  targetId: string
  choice: 'up' | 'down'
}): { ups: string[]; downs: string[] } {
  const { ups, downs, voterId, targetId, choice } = input
  if (voterId === targetId) return { ups, downs }
  if (ups.includes(voterId) || downs.includes(voterId)) return { ups, downs }
  if (choice === 'up') return { ups: [...ups, voterId], downs }
  return { ups, downs: [...downs, voterId] }
}

export function wheelRotation(kind: 'truth' | 'dare', spins = 4): number {
  const slice = 45
  const index = kind === 'truth' ? 0 : 1
  const center = index * slice + slice / 2
  return spins * 360 + (360 - center)
}

export function rpsOutcome(a: Hand, b: Hand): 'a' | 'b' | 'tie' {
  if (a === b) return 'tie'
  if (
    (a === 'rock' && b === 'scissors') ||
    (a === 'paper' && b === 'rock') ||
    (a === 'scissors' && b === 'paper')
  ) {
    return 'a'
  }
  return 'b'
}

export function firstTap(taps: { id: string; at: number }[], start: number): string | null {
  const valid = taps.filter((tap) => tap.at >= start)
  if (valid.length === 0) return null
  valid.sort((left, right) => left.at - right.at || left.id.localeCompare(right.id))
  return valid[0]?.id ?? null
}

function leaders(players: PlayerState[], value: (player: PlayerState) => number): string[] {
  let best = 0
  for (const player of players) best = Math.max(best, value(player))
  if (best <= 0) return []
  return players.filter((player) => value(player) === best).map((player) => player.id)
}

export function endAwards(players: PlayerState[], cheers: Record<string, number> = {}): Award[] {
  const specs: { id: AwardId; value: (player: PlayerState) => number }[] = [
    { id: 'brave', value: (player) => player.dares },
    { id: 'honest', value: (player) => player.truths },
    { id: 'lucky', value: (player) => player.luckies },
    { id: 'snake', value: (player) => player.snakes },
    { id: 'ladder', value: (player) => player.ladders },
    { id: 'cheer', value: (player) => cheers[player.id] ?? 0 },
  ]
  return specs
    .map((spec) => ({ id: spec.id, playerIds: leaders(players, spec.value) }))
    .filter((award) => award.playerIds.length > 0)
}
