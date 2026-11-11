import { Avatar } from './Avatar.tsx'
import type { Emote } from '../store/gameStore.ts'
import { cn } from '../utils/cn.ts'

export function PlayerToken({
  name,
  avatar,
  color,
  emote,
  active,
  compact = false,
}: {
  name: string
  avatar: string
  color: string
  emote: Emote
  active: boolean
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-full border-[3px] bg-white shadow-md',
        compact ? 'h-8 w-8' : 'h-5 w-5 sm:h-7 sm:w-7 md:h-9 md:w-9',
        active && 'ring-2 ring-white',
        emote === 'hop' && 'animate-hop',
        emote === 'happy' && 'animate-floaty',
        emote === 'win' && 'animate-floaty',
      )}
      style={{ borderColor: color, background: color }}
      title={name}
    >
      <div className="h-full w-full overflow-hidden rounded-full bg-white">
        <Avatar id={avatar} label={name} />
      </div>
    </div>
  )
}
