import { useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { ChallengeCard } from './components/ChallengeCard.tsx'
import { ConfirmDialog } from './components/ConfirmDialog.tsx'
import { HowToPlay } from './components/HowToPlay.tsx'
import { SettingsModal } from './components/SettingsModal.tsx'
import { VictoryScreen } from './components/VictoryScreen.tsx'
import { MainMenu } from './pages/MainMenu.tsx'
import { PlayScreen } from './pages/PlayScreen.tsx'
import { PlayerSetup } from './pages/PlayerSetup.tsx'
import { useGame } from './store/gameStore.ts'
import { audio } from './utils/audio.ts'
import { t } from './utils/i18n.ts'

export default function App() {
  const screen = useGame((state) => state.screen)
  const modal = useGame((state) => state.modal)
  const settings = useGame((state) => state.settings)
  const game = useGame((state) => state.game)
  const animating = useGame((state) => state.animating)
  const confirmNewGame = useGame((state) => state.confirmNewGame)
  const confirmLeave = useGame((state) => state.confirmLeave)
  const closeModal = useGame((state) => state.closeModal)

  useEffect(() => {
    document.documentElement.lang = settings.language
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion)
    audio.sync(settings)
  }, [settings])

  useEffect(() => {
    const unlock = () => audio.unlock()
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const current = useGame.getState().modal
      if (current) closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeModal])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  const showChallenge = game?.phase === 'challenge' && !animating
  const showVictory = game?.phase === 'won' && !animating && screen === 'play'

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'never'}>
      <div className="min-h-dvh overflow-x-clip bg-cream font-body text-ink">
        {screen === 'menu' ? <MainMenu /> : null}
        {screen === 'setup' ? <PlayerSetup /> : null}
        {screen === 'play' ? <PlayScreen /> : null}
        {modal === 'settings' ? <SettingsModal /> : null}
        {modal === 'howto' ? <HowToPlay /> : null}
        {modal === 'confirm-new' ? (
          <ConfirmDialog
            title={t(settings.language, 'newGameTitle')}
            body={t(settings.language, 'newGameBody')}
            confirmLabel={t(settings.language, 'confirm')}
            onConfirm={confirmNewGame}
          />
        ) : null}
        {modal === 'confirm-leave' ? (
          <ConfirmDialog
            title={t(settings.language, 'leaveTitle')}
            body={t(settings.language, 'leaveBody')}
            confirmLabel={t(settings.language, 'leaveConfirm')}
            onConfirm={confirmLeave}
          />
        ) : null}
        {showChallenge && game ? <ChallengeCard game={game} /> : null}
        {showVictory && game ? <VictoryScreen game={game} /> : null}
      </div>
    </MotionConfig>
  )
}
