import { useEffect } from 'react'
import { useGame } from '../store/gameStore.ts'
import { t } from '../utils/i18n.ts'
import type { CopyKey } from '../utils/i18n.ts'
import { Button } from './Button.tsx'

const STEPS: CopyKey[] = ['how1', 'how2', 'how3', 'how4', 'how5', 'how6', 'how7', 'how8']

export function HowToPlay() {
  const language = useGame((state) => state.settings.language)
  const close = useGame((state) => state.closeModal)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="howto-title">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label={t(language, 'close')} onClick={close} />
      <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-card sm:max-w-lg sm:rounded-3xl">
        <h2 id="howto-title" className="font-display text-3xl text-grape">
          {t(language, 'howTitle')}
        </h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map((key, index) => (
            <li key={key} className="flex gap-3 rounded-2xl bg-cream p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grape font-extrabold text-white">{index + 1}</span>
              <p className="font-bold leading-snug">{t(language, key)}</p>
            </li>
          ))}
        </ol>
        <Button className="mt-5 w-full" onClick={close}>
          {t(language, 'close')}
        </Button>
      </div>
    </div>
  )
}
