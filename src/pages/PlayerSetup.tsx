import { ChevronLeft, Minus, Plus } from 'lucide-react'
import { AVATAR_IDS, PLAYER_COLORS } from '../game/types.ts'
import type { BoardSize, Category } from '../game/types.ts'
import { useGame } from '../store/gameStore.ts'
import { t } from '../utils/i18n.ts'
import type { CopyKey } from '../utils/i18n.ts'
import { Avatar } from '../components/Avatar.tsx'
import { Button } from '../components/Button.tsx'

const CATEGORIES: Array<{ id: Category; label: CopyKey; hint: CopyKey }> = [
  { id: 'funny', label: 'catFunny', hint: 'catFunnyHint' },
  { id: 'friendship', label: 'catFriendship', hint: 'catFriendshipHint' },
  { id: 'couple', label: 'catCouple', hint: 'catCoupleHint' },
  { id: 'family', label: 'catFamily', hint: 'catFamilyHint' },
  { id: 'mixed', label: 'catMixed', hint: 'catMixedHint' },
]

export function PlayerSetup() {
  const language = useGame((state) => state.settings.language)
  const draft = useGame((state) => state.draft)
  const error = useGame((state) => state.setupError)
  const backToMenu = useGame((state) => state.backToMenu)
  const setCount = useGame((state) => state.setCount)
  const setBoardSize = useGame((state) => state.setBoardSize)
  const setCategory = useGame((state) => state.setCategory)
  const updatePlayer = useGame((state) => state.updatePlayer)
  const requestStart = useGame((state) => state.requestStart)
  const active = CATEGORIES.find((item) => item.id === draft.category) ?? CATEGORIES[4]

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-4 pb-28">
      <div className="flex items-center gap-2">
        <button type="button" onClick={backToMenu} className="inline-flex h-11 items-center gap-1 rounded-2xl bg-white px-3 font-extrabold shadow-sm" aria-label={t(language, 'back')}>
          <ChevronLeft className="h-5 w-5" aria-hidden />
          {t(language, 'back')}
        </button>
        <h1 className="font-display text-3xl text-grape sm:text-4xl">{t(language, 'setupTitle')}</h1>
      </div>
      <p className="mt-2 font-bold text-ink/70">{t(language, 'setupHint')}</p>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl">{t(language, 'playerCount')}</h2>
          <div className="flex items-center gap-2">
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cream" onClick={() => setCount(draft.count - 1)} aria-label="-">
              <Minus className="h-5 w-5" />
            </button>
            <span className="w-8 text-center font-display text-3xl">{draft.count}</span>
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cream" onClick={() => setCount(draft.count + 1)} aria-label="+">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <div className="mt-3 space-y-3">
        {draft.players.slice(0, draft.count).map((player, index) => (
          <section key={index} className="rounded-3xl bg-white p-4 shadow-card">
            <label className="block font-extrabold" htmlFor={`name-${index}`}>
              {t(language, 'playerName')} {index + 1}
            </label>
            <input
              id={`name-${index}`}
              data-testid={`player-name-${index}`}
              value={player.name}
              maxLength={16}
              onChange={(event) => updatePlayer(index, { name: event.target.value })}
              className="mt-2 w-full rounded-2xl border-2 border-cream bg-cream px-3 py-3 font-extrabold outline-none focus:border-grape"
            />
            <p className="mt-3 text-sm font-extrabold">{t(language, 'avatar')}</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {AVATAR_IDS.map((id) => {
                const selected = player.avatar === id
                return (
                  <button
                    key={id}
                    type="button"
                    aria-label={id}
                    aria-pressed={selected}
                    onClick={() => updatePlayer(index, { avatar: id })}
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-cream"
                    style={{ boxShadow: selected ? `0 0 0 3px ${player.color}` : undefined }}
                  >
                    <Avatar id={id} label={id} />
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-sm font-extrabold">{t(language, 'tokenColor')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLAYER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  aria-pressed={player.color === color}
                  onClick={() => updatePlayer(index, { color })}
                  className="h-10 w-10 rounded-full border-2 border-white"
                  style={{ background: color, outline: player.color === color ? '3px solid #2B2144' : undefined }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-3 rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-display text-xl">{t(language, 'category')}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={draft.category === item.id}
              onClick={() => setCategory(item.id)}
              className={`min-h-11 rounded-full px-4 font-extrabold ${draft.category === item.id ? 'bg-grape text-white' : 'bg-cream text-ink'}`}
            >
              {t(language, item.label)}
            </button>
          ))}
        </div>
        {active ? <p className="mt-2 text-sm font-bold text-ink/70">{t(language, active.hint)}</p> : null}
        <h2 className="mt-4 font-display text-xl">{t(language, 'boardLength')}</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <BoardChoice size={50} current={draft.boardSize} label={t(language, 'board50')} hint={t(language, 'board50hint')} onClick={setBoardSize} />
          <BoardChoice size={100} current={draft.boardSize} label={t(language, 'board100')} hint={t(language, 'board100hint')} onClick={setBoardSize} />
        </div>
      </section>

      {error ? (
        <p role="alert" className="mt-3 rounded-2xl bg-candy/15 px-3 py-2 font-extrabold text-candy">
          {t(language, error)}
        </p>
      ) : null}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/70 bg-cream/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <Button data-testid="setup-start" className="mx-auto w-full max-w-3xl text-lg" onClick={requestStart}>
          {t(language, 'startGame')}
        </Button>
      </div>
    </div>
  )
}

function BoardChoice({
  size,
  current,
  label,
  hint,
  onClick,
}: {
  size: BoardSize
  current: BoardSize
  label: string
  hint: string
  onClick: (size: BoardSize) => void
}) {
  const selected = current === size
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onClick(size)}
      className={`rounded-2xl px-4 py-3 text-left ${selected ? 'bg-grape text-white' : 'bg-cream text-ink'}`}
    >
      <span className="block font-display text-2xl">{label}</span>
      <span className="text-sm font-bold opacity-80">{hint}</span>
    </button>
  )
}
