import { BookOpen, Play, Settings, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import logo from '../assets/logo.svg'
import { useGame } from '../store/gameStore.ts'
import { t } from '../utils/i18n.ts'
import { Button } from '../components/Button.tsx'
import { Dice } from '../components/Dice.tsx'

const STAR = [
  { top: '8%', left: '12%', delay: '0s' },
  { top: '18%', left: '78%', delay: '0.4s' },
  { top: '70%', left: '8%', delay: '0.8s' },
  { top: '62%', left: '88%', delay: '0.2s' },
  { top: '40%', left: '92%', delay: '1s' },
]

export function MainMenu() {
  const language = useGame((state) => state.settings.language)
  const sfx = useGame((state) => state.settings.sfx)
  const hasSave = useGame((state) => state.hasSave)
  const savedWon = useGame((state) => state.savedWon)
  const setLanguage = useGame((state) => state.setLanguage)
  const toggleSfx = useGame((state) => state.toggleSfx)
  const openModal = useGame((state) => state.openModal)
  const goSetup = useGame((state) => state.goSetup)
  const continueGame = useGame((state) => state.continueGame)

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col overflow-x-hidden px-4 py-5">
      <div className="pointer-events-none absolute -left-10 top-16 h-40 w-40 rounded-full bg-candy/30 blur-2xl animate-drift" />
      <div className="pointer-events-none absolute -right-8 top-40 h-44 w-44 rounded-full bg-sky/30 blur-2xl animate-drift" />
      {STAR.map((star) => (
        <span
          key={`${star.top}-${star.left}`}
          className="pointer-events-none absolute text-sun animate-twinkle"
          style={{ top: star.top, left: star.left, animationDelay: star.delay }}
          aria-hidden
        >
          ★
        </span>
      ))}
      <header className="relative flex items-center justify-end gap-2">
        <div className="mr-auto flex rounded-full bg-white p-1 shadow-sm">
          <LangChip active={language === 'id'} onClick={() => setLanguage('id')}>
            ID
          </LangChip>
          <LangChip active={language === 'en'} onClick={() => setLanguage('en')}>
            EN
          </LangChip>
        </div>
        <IconButton label={sfx ? t(language, 'soundOn') : t(language, 'soundOff')} onClick={toggleSfx}>
          {sfx ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </IconButton>
        <IconButton label={t(language, 'settings')} onClick={() => openModal('settings')}>
          <Settings className="h-5 w-5" />
        </IconButton>
      </header>
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative mt-6 text-center"
      >
        <img src={logo} alt="" className="mx-auto h-16 w-16" />
        <p className="mt-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-candy">{t(language, 'eyebrow')}</p>
        <h1 className="mt-1 font-display text-[2.1rem] leading-none text-grape min-[380px]:text-5xl sm:text-7xl">
          SNAKE & DARE
        </h1>
        <p className="mx-auto mt-3 max-w-md text-lg font-extrabold text-ink/80">{t(language, 'subtitle')}</p>
      </motion.div>
      <div className="relative mx-auto mt-6 grid w-full max-w-md grid-cols-[1fr_auto] items-center gap-3 rounded-[2rem] bg-white/80 p-3 shadow-card">
        <MiniBoard />
        <div className="animate-wobble pr-1">
          <Dice value={5} rolling={false} label={t(language, 'roll')} />
        </div>
      </div>
      <div className="relative mx-auto mt-6 flex w-full max-w-md flex-1 flex-col gap-3">
        <Button data-testid="menu-play" className="text-lg" onClick={goSetup}>
          <Play className="h-5 w-5" aria-hidden />
          {t(language, 'play')}
        </Button>
        {hasSave ? (
          <Button data-testid="menu-continue" variant="pink" onClick={continueGame}>
            {savedWon ? t(language, 'viewResults') : t(language, 'continue')}
          </Button>
        ) : null}
        <Button variant="secondary" onClick={() => openModal('howto')}>
          <BookOpen className="h-5 w-5" aria-hidden />
          {t(language, 'howTo')}
        </Button>
        <Button variant="ghost" onClick={() => openModal('settings')}>
          <Settings className="h-5 w-5" aria-hidden />
          {t(language, 'settings')}
        </Button>
        <p className="mt-auto pb-2 text-center text-sm font-bold text-ink/50">{t(language, 'playersLocal')}</p>
      </div>
    </div>
  )
}

function LangChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-10 rounded-full px-3 text-sm font-extrabold ${active ? 'bg-grape text-white' : 'text-ink'}`}
    >
      {children}
    </button>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
      {children}
    </button>
  )
}

function MiniBoard() {
  const colors = ['#E5DBFF', '#FFD6E8', '#D0EBFF', '#D3F9D8', '#FFF3BF', '#FFD0E4']
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl">
      <div className="grid h-full grid-cols-5 grid-rows-5">
        {colors.map((color, index) => (
          <div key={index} style={{ background: colors[(index + Math.floor(index / 5)) % colors.length] ?? color }} />
        ))}
      </div>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M18 78 C 30 60, 55 70, 70 40" fill="none" stroke="#51CF66" strokeWidth="5" strokeLinecap="round" />
        <circle cx="70" cy="38" r="4" fill="#51CF66" />
        <line x1="28" y1="28" x2="48" y2="62" stroke="#C48A4A" strokeWidth="3" />
        <line x1="36" y1="24" x2="56" y2="58" stroke="#C48A4A" strokeWidth="3" />
      </svg>
    </div>
  )
}
