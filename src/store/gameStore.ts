import { create } from 'zustand'
import { applyDice, canRoll, completeChallenge, createGame, defaultDraft, redrawChallenge, rollD6 } from '../game/logic.ts'
import type { BoardSize, Category, Effect, GameState, Lang, PlayerDraft, Settings } from '../game/types.ts'
import { audio } from '../utils/audio.ts'
import type { CopyKey } from '../utils/i18n.ts'
import { discardGame, loadGame, loadSettings, saveGame, saveSettings } from '../utils/storage.ts'

export type Screen = 'menu' | 'setup' | 'play'
export type Modal = null | 'settings' | 'howto' | 'confirm-new' | 'confirm-leave'
export type Emote = 'idle' | 'hop' | 'happy' | 'sad' | 'win'

export interface LogEntry {
  id: number
  key: CopyKey
  vars: Record<string, string | number>
}

export interface SetupDraft {
  count: number
  boardSize: BoardSize
  category: Category
  players: PlayerDraft[]
}

interface GameStore {
  screen: Screen
  modal: Modal
  settings: Settings
  draft: SetupDraft
  setupError: CopyKey | null
  game: GameState | null
  hasSave: boolean
  savedWon: boolean
  animating: boolean
  diceValue: number
  diceRolling: boolean
  bonusRoll: boolean
  visual: Record<string, number> | null
  emotes: Record<string, Emote>
  log: LogEntry[]
  setLanguage: (language: Lang) => void
  patchSettings: (patch: Partial<Settings>) => void
  toggleSfx: () => void
  openModal: (modal: Exclude<Modal, null>) => void
  closeModal: () => void
  goSetup: () => void
  backToMenu: () => void
  setCount: (count: number) => void
  setBoardSize: (size: BoardSize) => void
  setCategory: (category: Category) => void
  updatePlayer: (index: number, patch: Partial<PlayerDraft>) => void
  requestStart: () => void
  confirmNewGame: () => void
  continueGame: () => void
  roll: () => void
  finishChallenge: (action: 'done' | 'skip') => void
  newCard: () => void
  playAgain: () => void
  requestLeave: () => void
  confirmLeave: () => void
}

const bootSave = loadGame()
const bootSettings = bootSave?.settings ?? loadSettings()
audio.sync(bootSettings)

let rollToken = 0
let logSerial = 1
let inflight: GameState | null = null

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function nextLog(key: CopyKey, vars: Record<string, string | number>): LogEntry {
  logSerial += 1
  return { id: logSerial, key, vars }
}

function effectLogs(effect: Effect, actor: string, players: GameState['players']): LogEntry[] {
  if (effect.type === 'roll') return [nextLog('logRoll', { name: actor, value: effect.value })]
  if (effect.type === 'bounce') return [nextLog('logBounce', { name: actor, roll: effect.roll })]
  if (effect.type === 'move') {
    const to = effect.path[effect.path.length - 1]
    return to === undefined ? [] : [nextLog('logMove', { name: actor, to })]
  }
  if (effect.type === 'snake') return [nextLog('logSnake', { name: actor, from: effect.from, to: effect.to })]
  if (effect.type === 'ladder') return [nextLog('logLadder', { name: actor, from: effect.from, to: effect.to })]
  if (effect.type === 'shield_block') return [nextLog('logShield', { name: actor })]
  if (effect.type === 'shield_gain') return [nextLog('logShieldGain', { name: actor })]
  if (effect.type === 'lucky' && effect.mode === 'shield') return [nextLog('logLuckyShield', { name: actor })]
  if (effect.type === 'lucky' && effect.mode === 'steps') return [nextLog('logLuckySteps', { name: actor })]
  if (effect.type === 'lucky') return [nextLog('logLuckyBlock', { name: actor })]
  if (effect.type === 'mystery' && effect.mode === 'forward2') return [nextLog('logMysteryForward', { name: actor })]
  if (effect.type === 'mystery' && effect.mode === 'back2') return [nextLog('logMysteryBack', { name: actor })]
  if (effect.type === 'mystery' && effect.mode === 'shield') return [nextLog('logMysteryShield', { name: actor })]
  if (effect.type === 'mystery' && effect.mode === 'points') return [nextLog('logMysteryPoints', { name: actor })]
  if (effect.type === 'mystery') return [nextLog('logMysteryExtra', { name: actor })]
  if (effect.type === 'double') return [nextLog('logDouble', { name: actor })]
  if (effect.type === 'challenge') return [nextLog(effect.kind === 'truth' ? 'logTruth' : 'logDare', { name: actor })]
  if (effect.type === 'score' && (effect.reason === 'truth' || effect.reason === 'dare')) {
    return [nextLog('logDone', { name: actor, points: effect.amount })]
  }
  if (effect.type === 'skip') return [nextLog('logSkip', { name: actor })]
  if (effect.type === 'win') return [nextLog('logWin', { name: actor })]
  if (effect.type === 'extra_roll') return [nextLog('logExtra', { name: actor })]
  if (effect.type === 'turn') return [nextLog('logTurn', { name: players[effect.playerIndex]?.name ?? '' })]
  return []
}

function logsFrom(effects: Effect[], prev: GameState): LogEntry[] {
  const actor = prev.players[prev.current]?.name ?? ''
  return effects.flatMap((effect) => effectLogs(effect, actor, prev.players))
}

function localizeName(name: string, language: Lang): string {
  const match = /^(?:Player|Pemain) (\d+)$/.exec(name.trim())
  if (!match?.[1]) return name
  return language === 'id' ? `Pemain ${match[1]}` : `Player ${match[1]}`
}

function draftError(players: PlayerDraft[]): CopyKey | null {
  for (const player of players) {
    const name = player.name.trim()
    if (!name) return 'nameRequired'
    if (name.length > 16) return 'nameLong'
  }
  return null
}

function persist(game: GameState, settings: Settings): void {
  saveGame(game, settings)
}

export const useGame = create<GameStore>((set, get) => ({
  screen: bootSave ? 'play' : 'menu',
  modal: null,
  settings: bootSettings,
  draft: {
    count: 2,
    boardSize: 100,
    category: 'mixed',
    players: defaultDraft(6, bootSettings.language),
  },
  setupError: null,
  game: bootSave?.game ?? null,
  hasSave: bootSave !== null,
  savedWon: bootSave?.game.phase === 'won',
  animating: false,
  diceValue: 1,
  diceRolling: false,
  bonusRoll: false,
  visual: null,
  emotes: {},
  log: [],

  setLanguage: (language) => {
    const settings = { ...get().settings, language }
    const draft = {
      ...get().draft,
      players: get().draft.players.map((player) => ({ ...player, name: localizeName(player.name, language) })),
    }
    audio.sync(settings)
    saveSettings(settings)
    const game = get().game
    if (game) persist(game, settings)
    set({ settings, draft })
  },

  patchSettings: (patch) => {
    audio.unlock()
    const settings = { ...get().settings, ...patch }
    audio.sync(settings)
    saveSettings(settings)
    const game = get().game
    if (game) persist(game, settings)
    set({ settings })
  },

  toggleSfx: () => {
    get().patchSettings({ sfx: !get().settings.sfx })
    if (get().settings.sfx) audio.play('click')
  },

  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),

  goSetup: () => {
    const language = get().settings.language
    set({
      screen: 'setup',
      modal: null,
      setupError: null,
      draft: {
        count: 2,
        boardSize: 100,
        category: 'mixed',
        players: defaultDraft(6, language),
      },
    })
  },

  backToMenu: () => {
    const game = get().game
    set({
      screen: 'menu',
      modal: null,
      hasSave: game !== null || loadGame() !== null,
      savedWon: (game ?? loadGame()?.game)?.phase === 'won',
    })
  },

  setCount: (count) => {
    const next = Math.min(6, Math.max(2, count))
    set({ draft: { ...get().draft, count: next }, setupError: null })
  },

  setBoardSize: (boardSize) => set({ draft: { ...get().draft, boardSize } }),
  setCategory: (category) => set({ draft: { ...get().draft, category } }),

  updatePlayer: (index, patch) => {
    const draft = get().draft
    const players = draft.players.map((player) => ({ ...player }))
    const current = players[index]
    if (!current) return
    if (patch.color) {
      const other = players.findIndex((player, i) => i !== index && i < draft.count && player.color === patch.color)
      if (other >= 0 && players[other]) players[other].color = current.color
    }
    if (patch.avatar) {
      const other = players.findIndex((player, i) => i !== index && i < draft.count && player.avatar === patch.avatar)
      if (other >= 0 && players[other]) players[other].avatar = current.avatar
    }
    players[index] = { ...current, ...patch }
    set({ draft: { ...draft, players }, setupError: null })
  },

  requestStart: () => {
    audio.unlock()
    const draft = get().draft
    const players = draft.players.slice(0, draft.count)
    const error = draftError(players)
    if (error) {
      set({ setupError: error })
      return
    }
    if (loadGame()) {
      set({ modal: 'confirm-new' })
      return
    }
    get().confirmNewGame()
  },

  confirmNewGame: () => {
    const { draft, settings } = get()
    const players = draft.players.slice(0, draft.count).map((player) => ({ ...player, name: player.name.trim() }))
    const error = draftError(players)
    if (error) {
      set({ setupError: error, modal: null })
      return
    }
    const game = createGame({
      players,
      boardSize: draft.boardSize,
      category: draft.category,
    })
    discardGame()
    persist(game, settings)
    inflight = null
    rollToken += 1
    set({
      game,
      screen: 'play',
      modal: null,
      hasSave: true,
      savedWon: false,
      animating: false,
      diceRolling: false,
      diceValue: 1,
      bonusRoll: false,
      visual: null,
      emotes: {},
      log: [],
      setupError: null,
    })
  },

  continueGame: () => {
    const file = loadGame()
    if (!file) {
      set({ hasSave: false, savedWon: false })
      return
    }
    audio.sync(file.settings)
    saveSettings(file.settings)
    set({
      game: file.game,
      settings: file.settings,
      screen: 'play',
      modal: null,
      hasSave: true,
      savedWon: file.game.phase === 'won',
      animating: false,
      diceRolling: false,
      visual: null,
      log: [],
      bonusRoll: false,
    })
  },

  roll: () => {
    const snap = get()
    if (!snap.game || snap.animating || !canRoll(snap.game)) return
    audio.unlock()
    audio.play('dice')
    const token = ++rollToken
    const value = rollD6(Math.random)
    const { state: next, effects } = applyDice(snap.game, value, Math.random)
    inflight = next
    set({ animating: true, diceRolling: true, diceValue: value, bonusRoll: false })
    const reduce = snap.settings.reduceMotion
    const activeGame = snap.game
    const playerId = activeGame.players[activeGame.current]?.id
    const actor = activeGame.players[activeGame.current]?.name ?? ''
    window.setTimeout(() => {
      if (token !== rollToken || !playerId) return
      set({ diceRolling: false })
      void (async () => {
        const step = reduce ? 0 : 300
        const note = (effect: Effect) => {
          set({ log: [...get().log, ...effectLogs(effect, actor, activeGame.players)].slice(-8) })
        }
        for (const effect of effects) {
          if (token !== rollToken) return
          if (effect.type !== 'move') note(effect)
          if (effect.type === 'move') {
            for (const tile of effect.path) {
              if (token !== rollToken) return
              set({ visual: { [playerId]: tile }, emotes: { ...get().emotes, [playerId]: 'hop' } })
              if (!reduce) audio.play('step')
              if (step) await wait(step)
            }
            note(effect)
          } else if (effect.type === 'snake') {
            set({ visual: { [playerId]: effect.to }, emotes: { ...get().emotes, [playerId]: 'sad' } })
            audio.play('snake')
            await wait(reduce ? 0 : 700)
          } else if (effect.type === 'ladder') {
            set({ visual: { [playerId]: effect.to }, emotes: { ...get().emotes, [playerId]: 'happy' } })
            audio.play('ladder')
            await wait(reduce ? 0 : 700)
          } else if (effect.type === 'bounce') {
            set({ emotes: { ...get().emotes, [playerId]: 'sad' } })
            audio.play('bounce')
            await wait(reduce ? 0 : 280)
          } else if (effect.type === 'win') {
            set({ emotes: { ...get().emotes, [playerId]: 'win' } })
            audio.play('win')
          } else if (effect.type === 'challenge') {
            audio.play('card')
          } else if (
            effect.type === 'shield_gain' ||
            effect.type === 'lucky' ||
            effect.type === 'mystery' ||
            effect.type === 'double' ||
            effect.type === 'score'
          ) {
            audio.play('reward')
          }
        }
        if (token !== rollToken) return
        const bonus = effects.some((effect) => effect.type === 'extra_roll')
        inflight = null
        set({
          game: next,
          visual: null,
          animating: false,
          bonusRoll: bonus,
          savedWon: next.phase === 'won',
          hasSave: true,
        })
        persist(next, get().settings)
      })()
    }, reduce ? 40 : 680)
  },

  finishChallenge: (action) => {
    const { game, animating, settings } = get()
    if (!game || animating || game.phase !== 'challenge') return
    audio.unlock()
    const { state, effects } = completeChallenge(game, action)
    audio.play(action === 'done' ? 'reward' : 'click')
    const bonus = effects.some((effect) => effect.type === 'extra_roll')
    set({
      game: state,
      bonusRoll: bonus,
      savedWon: state.phase === 'won',
      log: [...get().log, ...logsFrom(effects, game)].slice(-8),
    })
    persist(state, settings)
  },

  newCard: () => {
    const { game, animating } = get()
    if (!game || animating || game.phase !== 'challenge') return
    audio.unlock()
    audio.play('card')
    const { state } = redrawChallenge(game, Math.random)
    set({ game: state })
    persist(state, get().settings)
  },

  playAgain: () => {
    const { game, settings } = get()
    if (!game) return
    audio.unlock()
    const next = createGame({
      boardSize: game.boardSize,
      category: game.category,
      players: game.players.map((player) => ({
        name: player.name,
        avatar: player.avatar,
        color: player.color,
      })),
    })
    rollToken += 1
    inflight = null
    set({
      game: next,
      screen: 'play',
      modal: null,
      animating: false,
      diceRolling: false,
      diceValue: 1,
      bonusRoll: false,
      visual: null,
      emotes: {},
      log: [],
      hasSave: true,
      savedWon: false,
    })
    persist(next, settings)
  },

  requestLeave: () => set({ modal: 'confirm-leave' }),

  confirmLeave: () => {
    rollToken += 1
    const { game, settings } = get()
    const committed = inflight ?? game
    inflight = null
    if (committed) persist(committed, settings)
    set({
      screen: 'menu',
      modal: null,
      game: committed,
      animating: false,
      diceRolling: false,
      visual: null,
      hasSave: committed !== null,
      savedWon: committed?.phase === 'won',
    })
  },
}))
