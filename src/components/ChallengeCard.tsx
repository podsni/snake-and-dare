import { Check, Shuffle, SkipForward, Timer } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cardById, remainingCards } from '../game/deck.ts'
import type { GameState } from '../game/types.ts'
import { useGame } from '../store/gameStore.ts'
import { t } from '../utils/i18n.ts'
import { Button } from './Button.tsx'
import { Avatar } from './Avatar.tsx'

export function ChallengeCard({ game }: { game: GameState }) {
  const settings = useGame((state) => state.settings)
  const finish = useGame((state) => state.finishChallenge)
  const newCard = useGame((state) => state.newCard)
  const reduce = settings.reduceMotion
  const language = settings.language
  const player = game.players[game.current]
  const card = game.pendingCardId ? cardById(game.pendingCardId) : undefined
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    setLeft(null)
  }, [game.pendingCardId])

  useEffect(() => {
    if (left === null || left <= 0) return
    const id = window.setTimeout(() => setLeft((value) => (value === null ? null : value - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [left])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  if (!player) return null
  const points = card?.type === 'dare' ? 15 : 10
  const remaining = card ? remainingCards(card.type, game.category, game.usedCardIds) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="challenge-title">
      <div className="absolute inset-0 bg-ink/45" />
      <div className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-cream p-4 shadow-card sm:max-w-md sm:rounded-3xl sm:p-6">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-12 w-12 overflow-hidden rounded-full bg-white" style={{ boxShadow: `0 0 0 3px ${player.color}` }}>
            <Avatar id={player.avatar} label={player.name} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink/70">{t(language, 'challengeFor', { name: player.name })}</p>
            <h2 id="challenge-title" className="font-display text-3xl leading-none text-grape">
              {card ? t(language, card.type === 'truth' ? 'truth' : 'dare') : t(language, 'truth')}
            </h2>
          </div>
        </div>
        <div className="[perspective:900px]">
          <motion.div
            key={card?.id ?? 'missing'}
            data-testid="challenge-card"
            initial={reduce ? false : { rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="min-h-40 rounded-3xl bg-white p-5 shadow-pop"
          >
            <p className="text-xs font-extrabold uppercase tracking-wide text-candy">
              {t(language, game.category === 'funny' ? 'catFunny' : game.category === 'friendship' ? 'catFriendship' : game.category === 'couple' ? 'catCouple' : game.category === 'family' ? 'catFamily' : 'catMixed')}
            </p>
            <p className="mt-2 text-lg font-extrabold leading-snug text-ink">
              {card ? card.text[language] : t(language, 'missingCard')}
            </p>
            <p className="mt-4 text-sm font-bold text-ink/70">{t(language, 'skipFree')}</p>
            <p className="mt-1 text-sm font-extrabold text-grape">{t(language, 'pointsHint', { n: points })}</p>
            <p className="text-xs font-bold text-ink/50">{t(language, 'cardsLeft', { n: remaining })}</p>
          </motion.div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-3 font-extrabold text-ink"
            onClick={() => setLeft(30)}
          >
            <Timer className="h-4 w-4" aria-hidden />
            {left === null ? t(language, 'startTimer') : `${left}s`}
          </button>
          {left === 0 ? <span className="text-sm font-bold text-candy">{t(language, 'timeUp')}</span> : null}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button data-testid="challenge-done" onClick={() => finish('done')} disabled={!card}>
            <Check className="h-4 w-4" aria-hidden />
            {t(language, 'completed')}
          </Button>
          <Button data-testid="challenge-skip" variant="secondary" onClick={() => finish('skip')}>
            <SkipForward className="h-4 w-4" aria-hidden />
            {t(language, 'skip')}
          </Button>
          <Button data-testid="challenge-new" variant="sun" onClick={newCard} disabled={!card}>
            <Shuffle className="h-4 w-4" aria-hidden />
            {t(language, 'newCard')}
          </Button>
        </div>
      </div>
    </div>
  )
}
