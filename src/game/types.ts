export type Lang = 'en' | 'id'
export type BoardSize = 50 | 100
export type Category = 'funny' | 'friendship' | 'couple' | 'family' | 'mixed'
export type CardType = 'truth' | 'dare'
export type TileKind =
  | 'normal'
  | 'truth'
  | 'dare'
  | 'lucky'
  | 'mystery'
  | 'double'
  | 'shield'
  | 'snake'
  | 'ladder'
  | 'finish'

export type Phase = 'roll' | 'challenge' | 'won'
export type MysteryMode = 'forward2' | 'back2' | 'shield' | 'points' | 'extra_roll'
export type LuckyMode = 'steps' | 'shield' | 'blocked_steps'
export type ScoreReason = 'lucky' | 'mystery' | 'truth' | 'dare' | 'finish'

export interface Portal {
  from: number
  to: number
  kind: 'snake' | 'ladder'
}

export interface Tile {
  n: number
  kind: TileKind
  portalTo?: number
}

export interface Board {
  size: BoardSize
  cols: number
  rows: number
  tiles: Tile[]
  snakes: Portal[]
  ladders: Portal[]
}

export interface Card {
  id: string
  type: CardType
  category: Category
  text: Record<Lang, string>
}

export interface PlayerDraft {
  name: string
  avatar: string
  color: string
}

export interface PlayerState {
  id: string
  name: string
  avatar: string
  color: string
  position: number
  score: number
  shield: boolean
  truths: number
  dares: number
  skips: number
  snakes: number
  ladders: number
  luckies: number
}

export interface GameState {
  boardSize: BoardSize
  category: Category
  players: PlayerState[]
  current: number
  rollsLeft: number
  phase: Phase
  winnerId: string | null
  usedCardIds: string[]
  pendingCardId: string | null
  round: number
  turns: number
}

export type Rng = () => number

export type Effect =
  | { type: 'roll'; value: number }
  | { type: 'bounce'; roll: number; position: number }
  | { type: 'move'; path: number[] }
  | { type: 'snake'; from: number; to: number }
  | { type: 'ladder'; from: number; to: number }
  | { type: 'shield_block'; tile: number }
  | { type: 'shield_gain' }
  | { type: 'lucky'; mode: LuckyMode }
  | { type: 'mystery'; mode: MysteryMode }
  | { type: 'double' }
  | { type: 'challenge'; cardId: string; kind: CardType }
  | { type: 'score'; amount: number; reason: ScoreReason }
  | { type: 'skip' }
  | { type: 'win'; playerId: string }
  | { type: 'extra_roll' }
  | { type: 'turn'; playerIndex: number }

export interface Settings {
  language: Lang
  sfx: boolean
  music: boolean
  volume: number
  reduceMotion: boolean
}

export const AVATAR_IDS = [
  'cat',
  'rabbit',
  'panda',
  'fox',
  'bear',
  'robot',
  'dino',
  'alien',
  'owl',
  'frog',
] as const

export type AvatarId = (typeof AVATAR_IDS)[number]

export const PLAYER_COLORS = [
  '#7950F2',
  '#FF5C9D',
  '#4DABF7',
  '#37B24D',
  '#F59F00',
  '#FF922B',
  '#0CA678',
  '#E64980',
] as const
