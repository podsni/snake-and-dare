import { isGameState, normalizeGame } from '../game/logic.ts'
import type { GameState, Lang, Settings } from '../game/types.ts'

export const GAME_KEY = 'snake-dare:v1:game'
export const SETTINGS_KEY = 'snake-dare:v1:settings'

export interface SaveFile {
  version: 1
  game: GameState
  settings: Settings
  savedAt: number
}

export function defaultSettings(): Settings {
  const reduce =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return {
    language: 'en',
    sfx: true,
    music: false,
    volume: 0.7,
    reduceMotion: reduce,
  }
}

function clampVolume(value: unknown): number {
  const number = typeof value === 'number' ? value : 0.7
  if (!Number.isFinite(number)) return 0.7
  return Math.min(1, Math.max(0, number))
}

export function sanitizeSettings(value: unknown, fallback: Settings = defaultSettings()): Settings {
  if (!value || typeof value !== 'object') return fallback
  const raw = value as Partial<Settings>
  const language: Lang = raw.language === 'id' ? 'id' : 'en'
  return {
    language,
    sfx: typeof raw.sfx === 'boolean' ? raw.sfx : fallback.sfx,
    music: typeof raw.music === 'boolean' ? raw.music : fallback.music,
    volume: clampVolume(raw.volume),
    reduceMotion: typeof raw.reduceMotion === 'boolean' ? raw.reduceMotion : fallback.reduceMotion,
  }
}

export function serializeSave(file: SaveFile): string {
  return JSON.stringify(file)
}

export function parseSave(raw: string): SaveFile | null {
  try {
    const data = JSON.parse(raw) as Partial<SaveFile>
    if (!data || data.version !== 1 || !isGameState(data.game)) return null
    return {
      version: 1,
      game: normalizeGame(data.game),
      settings: sanitizeSettings(data.settings),
      savedAt: typeof data.savedAt === 'number' ? data.savedAt : Date.now(),
    }
  } catch {
    return null
  }
}

export function writeSave(storage: Storage, file: SaveFile): void {
  storage.setItem(GAME_KEY, serializeSave(file))
}

export function readSave(storage: Storage): SaveFile | null {
  const raw = storage.getItem(GAME_KEY)
  if (!raw) return null
  return parseSave(raw)
}

export function clearSave(storage: Storage): void {
  storage.removeItem(GAME_KEY)
}

export function writeSettings(storage: Storage, settings: Settings): void {
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function readSettings(storage: Storage): Settings | null {
  const raw = storage.getItem(SETTINGS_KEY)
  if (!raw) return null
  try {
    return sanitizeSettings(JSON.parse(raw))
  } catch {
    return null
  }
}

function browserStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

export function loadGame(): SaveFile | null {
  const storage = browserStorage()
  if (!storage) return null
  return readSave(storage)
}

export function saveGame(game: GameState, settings: Settings): void {
  const storage = browserStorage()
  if (!storage) return
  writeSave(storage, { version: 1, game, settings, savedAt: Date.now() })
  writeSettings(storage, settings)
}

export function discardGame(): void {
  const storage = browserStorage()
  if (!storage) return
  clearSave(storage)
}

export function loadSettings(): Settings {
  const storage = browserStorage()
  if (!storage) return defaultSettings()
  return readSettings(storage) ?? defaultSettings()
}

export function saveSettings(settings: Settings): void {
  const storage = browserStorage()
  if (!storage) return
  writeSettings(storage, settings)
}
