import { buildBoard, tileAt, tileCoord } from '../game/board.ts'
import type { BoardSize } from '../game/types.ts'
import type { Emote } from '../store/gameStore.ts'
import { BoardTile } from './BoardTile.tsx'
import { PlayerToken } from './PlayerToken.tsx'

const SNAKE_COLORS = ['#51CF66', '#FF922B', '#7950F2', '#F59F00', '#FF5C9D', '#4DABF7']

export interface BoardPlayer {
  id: string
  name: string
  avatar: string
  color: string
  position: number
}

export function GameBoard({
  size,
  players,
  visual,
  emotes,
  activeId,
}: {
  size: BoardSize
  players: BoardPlayer[]
  visual: Record<string, number> | null
  emotes: Record<string, Emote>
  activeId: string | null
}) {
  const board = buildBoard(size)
  const order = []
  for (let row = 0; row < board.rows; row += 1) {
    for (let col = 0; col < board.cols; col += 1) {
      const tile = board.tiles[tileAt(row, col, size) - 1]
      if (tile) order.push(tile)
    }
  }
  const width = board.cols * 100
  const height = board.rows * 100

  const shown = (id: string, fallback: number) => (visual && id in visual ? visual[id] ?? fallback : fallback)
  const groups = new Map<number, string[]>()
  for (const player of players) {
    const position = shown(player.id, player.position)
    if (position <= 0) continue
    const list = groups.get(position) ?? []
    list.push(player.id)
    groups.set(position, list)
  }

  return (
    <div className="w-full" data-testid="board">
      <div className="relative w-full shadow-card ring-4 ring-white rounded-2xl" style={{ aspectRatio: `${board.cols} / ${board.rows}` }}>
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${board.rows}, minmax(0, 1fr))` }}
        >
          {order.map((tile) => (
            <BoardTile key={`f-${tile.n}`} tile={tile} layer="floor" />
          ))}
        </div>
        </div>
        <svg className="absolute inset-0 z-[1] h-full w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
          {board.ladders.map((ladder) => (
            <Ladder key={`l-${ladder.from}`} from={center(ladder.from, size)} to={center(ladder.to, size)} />
          ))}
          {board.snakes.map((snake, index) => (
            <Snake
              key={`s-${snake.from}`}
              from={center(snake.from, size)}
              to={center(snake.to, size)}
              color={SNAKE_COLORS[index % SNAKE_COLORS.length] ?? '#51CF66'}
            />
          ))}
        </svg>
        <div
          className="pointer-events-none absolute inset-0 z-[2] grid"
          style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${board.rows}, minmax(0, 1fr))` }}
        >
          {order.map((tile) => (
            <BoardTile key={`m-${tile.n}`} tile={tile} layer="mark" />
          ))}
        </div>
        {players.map((player) => {
          const position = shown(player.id, player.position)
          if (position <= 0) return null
          const coord = tileCoord(position, size)
          const group = groups.get(position) ?? [player.id]
          const index = Math.max(0, group.indexOf(player.id))
          const angle = group.length > 1 ? (Math.PI * 2 * index) / group.length : 0
          const radius = group.length > 1 ? 7 : 0
          const left = ((coord.col + 0.68) / board.cols) * 100
          const top = ((coord.rowFromTop + 0.7) / board.rows) * 100
          return (
            <div
              key={player.id}
              className="absolute z-[3] transition-[left,top] duration-200"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                transform: `translate(-50%, -50%) translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px)`,
              }}
            >
              <PlayerToken
                name={player.name}
                avatar={player.avatar}
                color={player.color}
                emote={emotes[player.id] ?? 'idle'}
                active={player.id === activeId}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function center(n: number, size: BoardSize): { x: number; y: number } {
  const coord = tileCoord(n, size)
  return { x: coord.col * 100 + 50, y: coord.rowFromTop * 100 + 58 }
}

function Snake({ from, to, color }: { from: { x: number; y: number }; to: { x: number; y: number }; color: string }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const px = -dy / len
  const py = dx / len
  const wobble = Math.min(42, len * 0.16)
  const path = `M ${from.x} ${from.y} C ${from.x + dx * 0.33 + px * wobble} ${from.y + dy * 0.33 + py * wobble}, ${from.x + dx * 0.66 - px * wobble} ${from.y + dy * 0.66 - py * wobble}, ${to.x} ${to.y}`
  return (
    <g>
      <path d={path} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" />
      <path d={path} fill="none" stroke="#fff7" strokeWidth="6" strokeLinecap="round" />
      <circle cx={from.x + 6} cy={from.y + 4} r="13" fill={color} stroke="#2B2144" strokeWidth="2" />
      <circle cx={from.x + 2} cy={from.y} r="2.2" fill="#fff" />
      <circle cx={from.x + 10} cy={from.y} r="2.2" fill="#fff" />
      <circle cx={from.x + 2} cy={from.y} r="1" fill="#2B2144" />
      <circle cx={from.x + 10} cy={from.y} r="1" fill="#2B2144" />
      <circle cx={to.x} cy={to.y} r="5" fill={color} />
    </g>
  )
}

function Ladder({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const px = (-dy / len) * 14
  const py = (dx / len) * 14
  const rungs = Math.max(3, Math.round(len / 42))
  const lines = []
  for (let i = 1; i < rungs; i += 1) {
    const t = i / rungs
    const x = from.x + dx * t
    const y = from.y + dy * t
    lines.push(
      <line
        key={i}
        x1={x + px}
        y1={y + py}
        x2={x - px}
        y2={y - py}
        stroke="#8D5A2B"
        strokeWidth="4"
        strokeLinecap="round"
      />,
    )
  }
  return (
    <g>
      <line x1={from.x + px} y1={from.y + py} x2={to.x + px} y2={to.y + py} stroke="#C48A4A" strokeWidth="7" strokeLinecap="round" />
      <line x1={from.x - px} y1={from.y - py} x2={to.x - px} y2={to.y - py} stroke="#C48A4A" strokeWidth="7" strokeLinecap="round" />
      {lines}
    </g>
  )
}
