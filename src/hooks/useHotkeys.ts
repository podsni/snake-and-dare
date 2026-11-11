import { useEffect } from 'react'

export function useRollHotkey(enabled: boolean, onRoll: () => void): void {
  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A' || tag === 'SELECT' || tag === 'SUMMARY') {
          return
        }
        if (target.isContentEditable) return
      }
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault()
        onRoll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, onRoll])
}
