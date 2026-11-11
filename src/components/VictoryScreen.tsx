import { Home, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { GameState } from '../game/types.ts'
import { useGame } from '../store/gameStore.ts'
import { t } from '../utils/i18n.ts'
import { Avatar } from './Avatar.tsx'
import { Button } from './Button.tsx'
import { Leaderboard } from './Leaderboard.tsx'

export function VictoryScreen({ game }: { game: GameState }) {
  const settings = useGame((state) => state.settings)
  const playAgain = useGame((state) => state.playAgain)
  const backToMenu = useGame((state) => state.backToMenu)
  const language = settings.language
  const winner = game.players.find((player) => player.id === game.winnerId) ?? game.players[0]

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  if (!winner) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" data-testid="victory-screen" role="dialog" aria-modal="true">
      <Confetti enabled={!settings.reduceMotion} />
      <div className="absolute inset-0 bg-ink/35" />
      <motion.div
        initial={settings.reduceMotion ? false : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-card sm:max-w-lg sm:rounded-3xl"
      >
        <p className="text-center text-sm font-extrabold uppercase tracking-wide text-candy">{t(language, 'finish')}</p>
        <div className="mx-auto mt-3 h-24 w-24 overflow-hidden rounded-full bg-white shadow-pop" style={{ boxShadow: `0 0 0 6px ${winner.color}` }}>
          <Avatar id={winner.avatar} label={winner.name} />
        </div>
        <h2 className="mt-4 text-center font-display text-4xl text-grape">{t(language, 'winner', { name: winner.name })}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <Stat label={t(language, 'bonusPoints')} value={String(winner.score)} />
          <Stat label={t(language, 'truthsDone')} value={String(winner.truths)} />
          <Stat label={t(language, 'daresDone')} value={String(winner.dares)} />
          <Stat label={t(language, 'rounds')} value={String(game.round)} />
        </dl>
        <p className="mt-2 text-center text-sm font-bold text-ink/60">
          {t(language, 'turns')}: {game.turns}
        </p>
        <h3 className="mt-4 font-display text-xl">{t(language, 'standings')}</h3>
        <div className="mt-2">
          <Leaderboard players={game.players} language={language} activeId={winner.id} />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button onClick={playAgain}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t(language, 'playAgain')}
          </Button>
          <Button variant="secondary" onClick={backToMenu}>
            <Home className="h-4 w-4" aria-hidden />
            {t(language, 'mainMenu')}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-2 py-3">
      <dt className="text-xs font-bold text-ink/60">{label}</dt>
      <dd className="font-display text-2xl text-ink">{value}</dd>
    </div>
  )
}

function Confetti({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!enabled) return
    const canvas = ref.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    let frame = 0
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const colors = ['#7950F2', '#FF5C9D', '#4DABF7', '#51CF66', '#FFD43B', '#FF922B']
    const bits = Array.from({ length: 110 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight,
      r: 4 + Math.random() * 5,
      c: colors[Math.floor(Math.random() * colors.length)] ?? '#7950F2',
      v: 1.6 + Math.random() * 2.4,
      s: Math.random() * 0.2 + 0.05,
      a: Math.random() * Math.PI,
    }))
    const tick = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      for (const bit of bits) {
        bit.y += bit.v
        bit.x += Math.sin(bit.a) * 0.7
        bit.a += bit.s
        if (bit.y > canvas.height + 12) {
          bit.y = -12
          bit.x = Math.random() * canvas.width
        }
        context.save()
        context.translate(bit.x, bit.y)
        context.rotate(bit.a)
        context.fillStyle = bit.c
        context.fillRect(-bit.r, -bit.r / 2, bit.r * 2, bit.r)
        context.restore()
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [enabled])
  if (!enabled) return null
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-40 h-full w-full" aria-hidden />
}
