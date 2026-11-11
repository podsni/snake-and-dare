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
              className={`absolute z-[3] transition-[left,top] ease-out ${
                emotes[player.id] === 'sad' || emotes[player.id] === 'happy' ? 'duration-700' : 'duration-300'
              }`}
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

function curvePoint(
  from: { x: number; y: number },
  c1: { x: number; y: number },
  c2: { x: number; y: number },
  to: { x: number; y: number },
  t: number,
) {
  const u = 1 - t
  return {
    x: u * u * u * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * to.x,
    y: u * u * u * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * to.y,
  }
}

function Snake({ from, to, color }: { from: { x: number; y: number }; to: { x: number; y: number }; color: string }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const px = -dy / len
  const py = dx / len
  const wobble = Math.min(42, len * 0.16)
  const c1 = { x: from.x + dx * 0.33 + px * wobble, y: from.y + dy * 0.33 + py * wobble }
  const c2 = { x: from.x + dx * 0.66 - px * wobble, y: from.y + dy * 0.66 - py * wobble }
  const path = `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`
  const spots = [0.22, 0.4, 0.58, 0.76].map((t) => curvePoint(from, c1, c2, to, t))
  const head = { x: from.x + px * 6, y: from.y + py * 6 }
  return (
    <g>
      <path d={path} fill="none" stroke="#2B2144" strokeWidth="20" strokeLinecap="round" opacity="0.2" />
      <path d={path} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" />
      <path d={path} fill="none" stroke="#fff8" strokeWidth="6" strokeLinecap="round" />
      {spots.map((spot, index) => (
        <circle key={index} cx={spot.x} cy={spot.y} r={index % 2 === 0 ? 4.5 : 3.2} fill="#fff" opacity="0.85" />
      ))}
      <circle cx={head.x} cy={head.y} r="14" fill={color} stroke="#2B2144" strokeWidth="2.4" />
      <circle cx={head.x - 4} cy={head.y - 3} r="2.3" fill="#fff" />
      <circle cx={head.x + 4} cy={head.y - 3} r="2.3" fill="#fff" />
      <circle cx={head.x - 4} cy={head.y - 3} r="1.1" fill="#2B2144" />
      <circle cx={head.x + 4} cy={head.y - 3} r="1.1" fill="#2B2144" />
      <path d={`M ${head.x - 3} ${head.y + 4} Q ${head.x} ${head.y + 8} ${head.x + 3} ${head.y + 4}`} fill="none" stroke="#2B2144" strokeWidth="1.4" strokeLinecap="round" />
      <path d={`M ${head.x} ${head.y + 6} L ${head.x + 3} ${head.y + 11} L ${head.x - 1} ${head.y + 8}`} fill="#FF6B6B" />
      <circle cx={to.x} cy={to.y} r="4" fill={color} stroke="#2B2144" strokeWidth="1.5" />
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
      <line x1={from.x + px} y1={from.y + py} x2={to.x + px} y2={to.y + py} stroke="#A86B32" strokeWidth="9" strokeLinecap="round" />
      <line x1={from.x - px} y1={from.y - py} x2={to.x - px} y2={to.y - py} stroke="#A86B32" strokeWidth="9" strokeLinecap="round" />
      <line x1={from.x + px * 0.65} y1={from.y + py * 0.65} x2={to.x + px * 0.65} y2={to.y + py * 0.65} stroke="#E8C08A" strokeWidth="3" strokeLinecap="round" />
      <line x1={from.x - px * 0.65} y1={from.y - py * 0.65} x2={to.x - px * 0.65} y2={to.y - py * 0.65} stroke="#E8C08A" strokeWidth="3" strokeLinecap="round" />
      {lines}
    </g>
  )
}
