import { Shield } from 'lucide-react'
import { canRoll } from '../game/logic.ts'
import type { GameState } from '../game/types.ts'
import { useGame } from '../store/gameStore.ts'
import { t } from '../utils/i18n.ts'
import { Avatar } from './Avatar.tsx'
import { Button } from './Button.tsx'
import { Dice } from './Dice.tsx'
import { Leaderboard } from './Leaderboard.tsx'

export function GameHUD({ game, showRoll }: { game: GameState; showRoll: boolean }) {
  const language = useGame((state) => state.settings.language)
  const roll = useGame((state) => state.roll)
  const animating = useGame((state) => state.animating)
  const diceValue = useGame((state) => state.diceValue)
  const diceRolling = useGame((state) => state.diceRolling)
  const bonusRoll = useGame((state) => state.bonusRoll)
  const log = useGame((state) => state.log)
  const player = game.players[game.current]
  const locked = animating || !canRoll(game)
  if (!player) return null
  const place = player.position === 0 ? t(language, 'atStart') : t(language, 'tile', { n: player.position })
  const rollLabel = animating ? (diceRolling ? t(language, 'rolling') : t(language, 'moving')) : bonusRoll ? t(language, 'rollAgain') : t(language, 'roll')

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-white p-4 shadow-card">
        <p className="text-xs font-extrabold uppercase tracking-wide text-candy">{t(language, 'round', { n: game.round })}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="h-14 w-14 overflow-hidden rounded-full bg-cream" style={{ boxShadow: `0 0 0 3px ${player.color}` }}>
            <Avatar id={player.avatar} label={player.name} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl leading-none">{t(language, 'turnOf', { name: player.name })}</h2>
            <p className="mt-1 text-sm font-bold text-ink/70">
              {place} · {t(language, 'score', { n: player.score })}
            </p>
            {player.shield ? (
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-extrabold text-leaf">
                <Shield className="h-4 w-4" aria-hidden />
                {t(language, 'shieldReady')}
              </p>
            ) : null}
          </div>
        </div>
        {showRoll ? (
          <div className="mt-4 flex items-center gap-3">
            <Dice value={diceValue} rolling={diceRolling} label={`${rollLabel} ${diceRolling ? '' : diceValue}`} />
            <Button data-testid="roll-button" className="h-16 flex-1 text-lg" onClick={roll} disabled={locked}>
              {rollLabel}
            </Button>
          </div>
        ) : null}
        <p className="mt-3 text-xs font-bold text-ink/60">{t(language, 'exactHint')}</p>
      </div>
      {showRoll ? (
        <>
          <div className="rounded-3xl bg-white p-4 shadow-card">
            <h3 className="font-display text-xl">{t(language, 'leaderboard')}</h3>
            <p className="mb-2 text-xs font-bold text-ink/60">{t(language, 'winRule')}</p>
            <Leaderboard players={game.players} language={language} activeId={player.id} />
          </div>
          <LogList />
        </>
      ) : (
        <p className="sr-only" aria-live="polite">
          {log[log.length - 1] ? t(language, log[log.length - 1]!.key, log[log.length - 1]!.vars) : rollLabel}
        </p>
      )}
    </div>
  )
}

export function LogList() {
  const language = useGame((state) => state.settings.language)
  const log = useGame((state) => state.log)
  if (log.length === 0) return null
  return (
    <ul className="space-y-1 rounded-3xl bg-white/80 p-3 text-sm font-bold text-ink/80" aria-live="polite">
      {log.map((entry) => (
        <li key={entry.id}>{t(language, entry.key, entry.vars)}</li>
      ))}
    </ul>
  )
}

export function RollBar() {
  const game = useGame((state) => state.game)
  const language = useGame((state) => state.settings.language)
  const roll = useGame((state) => state.roll)
  const animating = useGame((state) => state.animating)
  const diceValue = useGame((state) => state.diceValue)
  const diceRolling = useGame((state) => state.diceRolling)
  const bonusRoll = useGame((state) => state.bonusRoll)
  if (!game) return null
  const locked = animating || !canRoll(game)
  const rollLabel = animating ? (diceRolling ? t(language, 'rolling') : t(language, 'moving')) : bonusRoll ? t(language, 'rollAgain') : t(language, 'roll')
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/95 px-3 py-2 backdrop-blur md:hidden" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Dice value={diceValue} rolling={diceRolling} label={rollLabel} />
        <Button data-testid="roll-button-mobile" className="h-16 flex-1 text-lg" onClick={roll} disabled={locked}>
          {rollLabel}
        </Button>
      </div>
    </div>
  )
}
