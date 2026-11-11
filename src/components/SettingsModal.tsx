import { useEffect } from 'react'
import type { Lang } from '../game/types.ts'
import { useGame } from '../store/gameStore.ts'
import { t } from '../utils/i18n.ts'
import { Button } from './Button.tsx'

export function SettingsModal() {
  const settings = useGame((state) => state.settings)
  const patch = useGame((state) => state.patchSettings)
  const setLanguage = useGame((state) => state.setLanguage)
  const close = useGame((state) => state.closeModal)
  const language = settings.language

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label={t(language, 'close')} onClick={close} />
      <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-card sm:max-w-md sm:rounded-3xl">
        <h2 id="settings-title" className="font-display text-3xl text-grape">
          {t(language, 'settings')}
        </h2>
        <div className="mt-4 space-y-4">
          <Toggle label={t(language, 'sound')} on={settings.sfx} onClick={() => patch({ sfx: !settings.sfx })} language={language} />
          <Toggle label={t(language, 'music')} on={settings.music} onClick={() => patch({ music: !settings.music })} language={language} />
          <label className="block">
            <span className="font-extrabold">{t(language, 'volume')}</span>
            <input
              className="mt-2 w-full accent-grape"
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(event) => patch({ volume: Number(event.target.value) / 100 })}
            />
          </label>
          <Toggle
            label={t(language, 'reduceMotion')}
            on={settings.reduceMotion}
            onClick={() => patch({ reduceMotion: !settings.reduceMotion })}
            language={language}
            testId="reduce-motion"
          />
          <div>
            <p className="font-extrabold">{t(language, 'language')}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <LangButton active={language === 'en'} onClick={() => setLanguage('en')}>
                {t(language, 'english')}
              </LangButton>
              <LangButton active={language === 'id'} onClick={() => setLanguage('id')}>
                {t(language, 'indonesian')}
              </LangButton>
            </div>
          </div>
        </div>
        <Button data-testid="settings-close" className="mt-5 w-full" variant="secondary" onClick={close}>
          {t(language, 'close')}
        </Button>
      </div>
    </div>
  )
}

function Toggle({
  label,
  on,
  onClick,
  language,
  testId,
}: {
  label: string
  on: boolean
  onClick: () => void
  language: Lang
  testId?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-extrabold">{label}</span>
      <button
        type="button"
        role="switch"
        data-testid={testId}
        aria-checked={on}
        onClick={onClick}
        className={`min-h-11 rounded-full px-4 font-extrabold ${on ? 'bg-grape text-white' : 'bg-cream text-ink'}`}
      >
        {on ? t(language, 'on') : t(language, 'off')}
      </button>
    </div>
  )
}

function LangButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-2xl font-extrabold ${active ? 'bg-grape text-white' : 'bg-cream text-ink'}`}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}
