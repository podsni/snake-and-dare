import { Component, lazy, Suspense, useEffect } from 'react'
import type { ReactNode } from 'react'
import { hasWebGL } from '../game/diceThrow.ts'
import { useGame } from '../store/gameStore.ts'
import { t } from '../utils/i18n.ts'

const PhysicsDie = lazy(() => import('./PhysicsDie.tsx'))

class DieBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFail()
  }
  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

export function DiceTray() {
  const reduce = useGame((state) => state.settings.reduceMotion)
  const language = useGame((state) => state.settings.language)
  const physicsOn = useGame((state) => state.physicsOn)
  const setPhysics = useGame((state) => state.setPhysics)
  const diceRolling = useGame((state) => state.diceRolling)
  const landFlash = useGame((state) => state.landFlash)
  const diceValue = useGame((state) => state.diceValue)
  const throwRequest = useGame((state) => state.throwRequest)
  const commitRoll = useGame((state) => state.commitRoll)

  useEffect(() => {
    setPhysics(!reduce && hasWebGL())
  }, [reduce, setPhysics])

  if (!physicsOn || !throwRequest || (!diceRolling && !landFlash)) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-24 z-40 overflow-hidden rounded-3xl border-4 border-white bg-cream shadow-card md:bottom-8 md:left-auto md:right-8 md:w-[28rem]"
      data-testid={diceRolling ? 'dice-tumble' : 'dice-landed'}
    >
      <div className="relative h-72 w-full">
        <DieBoundary
          onFail={() => {
            setPhysics(false)
            if (diceRolling) commitRoll(1 + Math.floor(Math.random() * 6))
          }}
        >
          <Suspense fallback={null}>
            <PhysicsDie charge={throwRequest.charge} throwId={throwRequest.id} onResult={commitRoll} />
          </Suspense>
        </DieBoundary>
        {landFlash ? (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <p className="rounded-2xl bg-white px-5 py-1 font-display text-6xl text-grape shadow-pop">{diceValue}</p>
          </div>
        ) : (
          <p className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-extrabold text-ink">
            {t(language, 'rolling')}
          </p>
        )}
      </div>
    </div>
  )
}
