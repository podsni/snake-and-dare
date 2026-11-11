import { leaderboard } from '../game/logic.ts'
import type { PlayerState } from '../game/types.ts'
import { t } from '../utils/i18n.ts'
import type { Lang } from '../game/types.ts'
import { Avatar } from './Avatar.tsx'

export function Leaderboard({ players, language, activeId }: { players: PlayerState[]; language: Lang; activeId?: string }) {
  const rows = leaderboard(players)
  return (
    <ol className="space-y-2">
      {rows.map((player, index) => (
        <li
          key={player.id}
          className="flex items-center gap-2 rounded-2xl bg-cream px-2 py-2"
          style={{ outline: player.id === activeId ? `2px solid ${player.color}` : undefined }}
        >
          <span className="w-5 text-center text-sm font-extrabold text-grape">{index + 1}</span>
          <span className="h-8 w-8 overflow-hidden rounded-full bg-white" style={{ boxShadow: `0 0 0 2px ${player.color}` }}>
            <Avatar id={player.avatar} label={player.name} />
          </span>
          <span className="min-w-0 flex-1 truncate font-extrabold">{player.name}</span>
          <span className="text-xs font-bold text-ink/70">{player.position === 0 ? '—' : player.position}</span>
          <span className="text-xs font-extrabold text-grape">{t(language, 'score', { n: player.score })}</span>
        </li>
      ))}
    </ol>
  )
}
