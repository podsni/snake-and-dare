import { CircleHelp, Dices, Flame, Home, MessageCircleQuestion, Minus, Plus, Settings, Shield, Sparkles, Star, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useRollHotkey } from '../hooks/useHotkeys.ts'
import { useGame } from '../store/gameStore.ts'
import { enableShake } from '../utils/feel.ts'
import { t } from '../utils/i18n.ts'
import type { CopyKey } from '../utils/i18n.ts'
import { Button } from '../components/Button.tsx'
import { GameBoard } from '../components/GameBoard.tsx'
import { GameHUD, LogList, RollBar } from '../components/GameHUD.tsx'
import { Leaderboard } from '../components/Leaderboard.tsx'
import { MiniGame } from '../components/MiniGame.tsx'
import { PlayerToken } from '../components/PlayerToken.tsx'

const LEGEND: Array<{ key: CopyKey; icon: typeof Star; color: string }> = [
  { key: 'truth', icon: MessageCircleQuestion, color: '#7950F2' },
  { key: 'dare', icon: Flame, color: '#FF5C9D' },
  { key: 'lucky', icon: Star, color: '#F59F00' },
  { key: 'mystery', icon: Sparkles, color: '#4DABF7' },
  { key: 'doubleDice', icon: Dices, color: '#37B24D' },
  { key: 'shield', icon: Shield, color: '#0CA678' },
]

export function PlayScreen() {
  const game = useGame((state) => state.game)
  const language = useGame((state) => state.settings.language)
  const sfx = useGame((state) => state.settings.sfx)
  const visual = useGame((state) => state.visual)
  const emotes = useGame((state) => state.emotes)
  const animating = useGame((state) => state.animating)
  const modal = useGame((state) => state.modal)
  const roll = useGame((state) => state.roll)
  const openModal = useGame((state) => state.openModal)
  const toggleSfx = useGame((state) => state.toggleSfx)
  const requestLeave = useGame((state) => state.requestLeave)
  const vote = useGame((state) => state.vote)
  const voteFor = useGame((state) => state.voteFor)
  const closeVote = useGame((state) => state.closeVote)
  const mini = useGame((state) => state.mini)
  const [zoom, setZoom] = useState(1)
  const [shakeOn, setShakeOn] = useState(false)

  useRollHotkey(!!game && game.phase === 'roll' && !animating && modal === null && !mini, roll)

  useEffect(() => {
    if (!shakeOn || !game || game.phase !== 'roll' || animating || modal || mini) return
    let last = 0
    const onMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity
      if (!acc) return
      const force = Math.abs(acc.x ?? 0) + Math.abs(acc.y ?? 0) + Math.abs(acc.z ?? 0)
      if (force > 32 && Date.now() - last > 1200) {
        last = Date.now()
        roll()
      }
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [shakeOn, game, animating, modal, mini, roll])

  if (!game) return null
  const active = game.players[game.current]
  const waiting = game.players.filter((player) => {
    const position = visual && player.id in visual ? visual[player.id] : player.position
    return (position ?? 0) <= 0
  })

  return (
    <div className="mx-auto min-h-dvh w-full max-w-6xl px-3 py-3 pb-44 md:pb-6">
      <header className="mb-3 flex items-center gap-2">
        <button type="button" className="inline-flex h-11 items-center gap-1 rounded-2xl bg-white px-3 font-extrabold shadow-sm" onClick={requestLeave}>
          <Home className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{t(language, 'menu')}</span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl text-grape sm:text-2xl">SNAKE & DARE</p>
          <p className="text-xs font-extrabold text-ink/60">{t(language, 'round', { n: game.round })}</p>
        </div>
        <IconButton label={sfx ? t(language, 'soundOn') : t(language, 'soundOff')} onClick={toggleSfx}>
          {sfx ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </IconButton>
        <IconButton label={t(language, 'howTo')} onClick={() => openModal('howto')}>
          <CircleHelp className="h-5 w-5" />
        </IconButton>
        <IconButton label={t(language, 'settings')} onClick={() => openModal('settings')}>
          <Settings className="h-5 w-5" />
        </IconButton>
        <button
          type="button"
          className={`hidden h-11 rounded-2xl px-3 text-sm font-extrabold sm:inline-flex ${shakeOn ? 'bg-grape text-white' : 'bg-white'}`}
          onClick={() => {
            void enableShake().then((ok) => setShakeOn(ok))
          }}
        >
          {shakeOn ? t(language, 'shakeOn') : t(language, 'shakeRoll')}
        </button>
      </header>

      <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {active ? (
            <p
              className="mb-2 rounded-2xl border-4 bg-white px-3 py-2 font-display text-2xl leading-none md:hidden"
              style={{ borderColor: active.color }}
            >
              {t(language, 'turnOf', { name: active.name })}
            </p>
          ) : null}
          <button
            type="button"
            className={`mb-2 min-h-11 rounded-2xl px-3 text-sm font-extrabold md:hidden ${shakeOn ? 'bg-grape text-white' : 'bg-white'}`}
            onClick={() => {
              void enableShake().then((ok) => setShakeOn(ok))
            }}
          >
            {shakeOn ? t(language, 'shakeOn') : t(language, 'shakeRoll')}
          </button>
          {active ? (
            <div className="mb-3 flex items-center gap-2 overflow-x-auto rounded-3xl bg-white p-2 shadow-card md:hidden">
              {game.players.map((player) => (
                <div key={player.id} className={`flex shrink-0 items-center gap-2 rounded-2xl px-2 py-1 ${player.id === active.id ? 'bg-cream' : ''}`}>
                  <PlayerToken name={player.name} avatar={player.avatar} color={player.color} emote="idle" active={player.id === active.id} compact />
                  <span className="max-w-24 truncate text-sm font-extrabold">{player.name}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mb-2 flex items-center justify-end gap-2">
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm" aria-label={t(language, 'zoomOut')} onClick={() => setZoom((value) => Math.max(1, Number((value - 0.2).toFixed(2))))}>
              <Minus className="h-4 w-4" />
            </button>
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm" aria-label={t(language, 'zoomIn')} onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.2).toFixed(2))))}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="max-w-full overflow-auto">
            <div style={{ width: `${zoom * 100}%` }} className="min-w-full">
              <GameBoard
                size={game.boardSize}
                players={game.players}
                visual={visual}
                emotes={emotes}
                activeId={game.phase === 'won' ? game.winnerId : active?.id ?? null}
              />
            </div>
          </div>
          {waiting.length > 0 ? (
            <div className="mt-3 rounded-3xl bg-white/80 p-3">
              <p className="text-sm font-extrabold text-ink/70">{t(language, 'startDock')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {waiting.map((player) => (
                  <div key={player.id} className="flex items-center gap-2 rounded-full bg-cream py-1 pl-1 pr-3">
                    <PlayerToken name={player.name} avatar={player.avatar} color={player.color} emote={emotes[player.id] ?? 'idle'} active={player.id === active?.id} compact />
                    <span className="text-sm font-extrabold">{player.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {LEGEND.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-extrabold">
                <item.icon className="h-3.5 w-3.5" color={item.color} aria-hidden />
                {t(language, item.key)}
              </span>
            ))}
          </div>
          <div className="mt-3 md:hidden">
            <details className="rounded-3xl bg-white p-3 shadow-card">
              <summary className="cursor-pointer font-display text-lg">{t(language, 'leaderboard')}</summary>
              <p className="my-2 text-xs font-bold text-ink/60">{t(language, 'winRule')}</p>
              <Leaderboard players={game.players} language={language} activeId={active?.id} />
            </details>
            <div className="mt-3">
              <LogList />
            </div>
          </div>
        </div>
        <aside className="hidden md:block">
          <GameHUD game={game} showRoll />
        </aside>
      </div>
      {vote ? (
        <div className="fixed inset-x-3 bottom-36 z-40 rounded-3xl bg-white p-3 shadow-card md:bottom-6 md:left-auto md:right-6 md:w-80" data-testid="vote-bar">
          <p className="font-extrabold">{t(language, 'voteTitle', { name: vote.targetName })}</p>
          <div className="mt-2 space-y-2">
            {game.players.filter((player) => player.id !== vote.targetId).map((player) => (
              <div key={player.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-extrabold">{player.name}</span>
                <Button variant="secondary" className="min-h-10 px-3 py-2 text-sm" onClick={() => voteFor(player.id, 'up')}>{t(language, 'voteUp')}</Button>
                <Button variant="ghost" className="min-h-10 px-3 py-2 text-sm" onClick={() => voteFor(player.id, 'down')}>{t(language, 'voteDown')}</Button>
              </div>
            ))}
          </div>
          <Button className="mt-2 w-full" onClick={closeVote}>{t(language, 'voteDone')}</Button>
        </div>
      ) : null}
      {mini ? <MiniGame game={game} /> : null}
      <RollBar />
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
      {children}
    </button>
  )
}
