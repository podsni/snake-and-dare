import { useState } from 'react'
import { firstTap, rpsOutcome } from '../game/juice.ts'
import type { Hand } from '../game/juice.ts'
import type { GameState } from '../game/types.ts'
import { useGame } from '../store/gameStore.ts'
import { t } from '../utils/i18n.ts'
import { Button } from './Button.tsx'

export function MiniGame({ game }: { game: GameState }) {
  const language = useGame((state) => state.settings.language)
  const close = useGame((state) => state.setMini)
  const cheer = useGame((state) => state.cheer)
  const [mode, setMode] = useState<'pick' | 'reaction' | 'rps'>('pick')
  const [start, setStart] = useState<number | null>(null)
  const [winner, setWinner] = useState<string | null>(null)
  const [hands, setHands] = useState<Record<string, Hand>>({})
  const a = game.players[game.current]
  const b = game.players[(game.current + 1) % game.players.length]
  if (!a || !b) return null

  const beginRace = () => {
    setMode('reaction')
    setWinner(null)
    setStart(null)
    window.setTimeout(() => setStart(performance.now()), 600 + Math.random() * 900)
  }

  const tap = (id: string) => {
    if (start === null || winner) return
    const who = firstTap([{ id, at: performance.now() }], start)
    if (!who) return
    setWinner(who)
    cheer(who)
  }

  const pick = (id: string, hand: Hand) => {
    const next = { ...hands, [id]: hand }
    setHands(next)
    if (next[a.id] && next[b.id]) {
      const result = rpsOutcome(next[a.id], next[b.id])
      const who = result === 'a' ? a.id : result === 'b' ? b.id : ''
      setWinner(who || 'tie')
      if (who) cheer(who)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" data-testid="mini-game">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label={t(language, 'voteDone')} onClick={() => close(false)} />
      <div className="relative w-full rounded-t-3xl bg-white p-5 shadow-card sm:max-w-md sm:rounded-3xl">
        <h2 className="font-display text-3xl text-grape">{t(language, 'miniTitle')}</h2>
        <p className="mt-1 text-sm font-bold text-ink/70">{t(language, 'miniHint')}</p>
        {mode === 'pick' ? (
          <div className="mt-4 grid gap-2">
            <Button onClick={beginRace}>{t(language, 'miniReaction')}</Button>
            <Button variant="sun" onClick={() => setMode('rps')}>{t(language, 'miniRps')}</Button>
          </div>
        ) : null}
        {mode === 'reaction' ? (
          <div className="mt-4">
            <p className="text-center font-display text-4xl">{start === null ? t(language, 'miniWait') : t(language, 'miniGo')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {game.players.map((player) => (
                <Button key={player.id} variant="secondary" disabled={start === null || !!winner} onClick={() => tap(player.id)}>
                  {player.name}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {mode === 'rps' ? (
          <div className="mt-4 space-y-3">
            {[a, b].map((player) => (
              <div key={player.id}>
                <p className="font-extrabold">{player.name}</p>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(['rock', 'paper', 'scissors'] as const).map((hand) => (
                    <Button key={hand} variant={hands[player.id] === hand ? 'primary' : 'secondary'} className="min-h-10 px-2 py-2 text-sm" onClick={() => pick(player.id, hand)} disabled={!!hands[player.id]}>
                      {t(language, hand)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {winner ? <p className="mt-3 font-extrabold text-grape">{winner === 'tie' ? t(language, 'miniTie') : t(language, 'miniWin', { name: game.players.find((player) => player.id === winner)?.name ?? '' })}</p> : null}
        <Button className="mt-4 w-full" variant="ghost" onClick={() => close(false)}>
          {t(language, 'voteDone')}
        </Button>
      </div>
    </div>
  )
}
