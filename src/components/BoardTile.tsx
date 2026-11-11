import { Dices, Flame, Home, MessageCircleQuestion, Shield, Sparkles, Star } from 'lucide-react'
import { tileStripe } from '../game/board.ts'
import type { Tile, TileKind } from '../game/types.ts'

const SPECIAL_BG: Partial<Record<TileKind, string>> = {
  truth: '#DDD3FF',
  dare: '#FFD0E4',
  lucky: '#FFF1B8',
  mystery: '#C5E4FF',
  double: '#C9F5D4',
  shield: '#B8F5E4',
  finish: '#FFD43B',
}

const ICONS = {
  truth: MessageCircleQuestion,
  dare: Flame,
  lucky: Star,
  mystery: Sparkles,
  double: Dices,
  shield: Shield,
  finish: Home,
} as const

export function BoardTile({ tile, layer }: { tile: Tile; layer: 'floor' | 'mark' }) {
  if (layer === 'floor') {
    return (
      <div
        className="h-full w-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)]"
        style={{ background: SPECIAL_BG[tile.kind] ?? tileStripe(tile.n) }}
      />
    )
  }
  const Icon = tile.kind in ICONS ? ICONS[tile.kind as keyof typeof ICONS] : null
  return (
    <div className="relative h-full w-full">
      <span className="absolute left-0.5 top-0.5 rounded bg-white/95 px-0.5 text-[9px] font-extrabold leading-none text-ink shadow-sm min-[380px]:text-[10px] sm:text-xs md:text-sm">
        {tile.n}
      </span>
      {Icon ? (
        <Icon
          aria-hidden
          className="absolute bottom-0.5 right-0.5 h-3 w-3 text-ink/80 sm:h-4 sm:w-4 md:bottom-1 md:right-1 md:h-5 md:w-5"
        />
      ) : null}
    </div>
  )
}
