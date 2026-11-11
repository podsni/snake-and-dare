import { useState } from 'react'
import { useGame } from '../store/gameStore.ts'
import { t } from '../utils/i18n.ts'
import type { CopyKey } from '../utils/i18n.ts'
import { Button } from './Button.tsx'

const STEPS: CopyKey[] = ['tutorial1', 'tutorial2', 'tutorial3']
const KEY = 'snake-dare:v1:tutorial'

export function seenTutorial(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}

export function Tutorial({ onDone }: { onDone: () => void }) {
  const language = useGame((state) => state.settings.language)
  const [step, setStep] = useState(0)
  const finish = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* ignore private mode */
    }
    onDone()
  }
  const key = STEPS[step] ?? 'tutorial1'
  const last = step >= STEPS.length - 1
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" data-testid="tutorial">
      <div className="absolute inset-0 bg-ink/45" />
      <div className="relative m-3 w-full max-w-md rounded-3xl bg-white p-5 shadow-card">
        <p className="text-sm font-extrabold text-candy">{step + 1} / {STEPS.length}</p>
        <p className="mt-2 font-display text-2xl leading-snug text-ink">{t(language, key)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={finish}>{t(language, 'tutorialSkip')}</Button>
          <Button data-testid="tutorial-next" onClick={() => (last ? finish() : setStep((value) => value + 1))}>
            {last ? t(language, 'tutorialDone') : t(language, 'tutorialNext')}
          </Button>
        </div>
      </div>
    </div>
  )
}
