import { useEffect } from 'react'
import { useGame } from '../store/gameStore.ts'
import { t } from '../utils/i18n.ts'
import { Button } from './Button.tsx'

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
}: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
}) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label={t(language, 'cancel')} onClick={close} />
      <div className="relative w-full rounded-t-3xl bg-white p-5 shadow-card sm:max-w-md sm:rounded-3xl">
        <h2 id="confirm-title" className="font-display text-3xl text-ink">
          {title}
        </h2>
        <p className="mt-2 font-bold text-ink/80">{body}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={close}>
            {t(language, 'cancel')}
          </Button>
          <Button variant="pink" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
