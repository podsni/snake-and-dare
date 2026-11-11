import type { Board, BoardSize, Portal, Tile, TileKind } from './types.ts'

export const LADDERS_100: Portal[] = [
  { from: 3, to: 22, kind: 'ladder' },
  { from: 8, to: 30, kind: 'ladder' },
  { from: 20, to: 41, kind: 'ladder' },
  { from: 28, to: 55, kind: 'ladder' },
  { from: 44, to: 63, kind: 'ladder' },
  { from: 71, to: 92, kind: 'ladder' },
]

export const SNAKES_100: Portal[] = [
  { from: 27, to: 5, kind: 'snake' },
  { from: 39, to: 17, kind: 'snake' },
  { from: 58, to: 34, kind: 'snake' },
  { from: 67, to: 49, kind: 'snake' },
  { from: 83, to: 61, kind: 'snake' },
  { from: 97, to: 76, kind: 'snake' },
]

/** A shorter course. Endpoints never sit on another snake, ladder, or special. */
export const LADDERS_50: Portal[] = [
  { from: 2, to: 18, kind: 'ladder' },
  { from: 8, to: 26, kind: 'ladder' },
  { from: 14, to: 32, kind: 'ladder' },
  { from: 21, to: 39, kind: 'ladder' },
  { from: 33, to: 48, kind: 'ladder' },
]

export const SNAKES_50: Portal[] = [
  { from: 16, to: 4, kind: 'snake' },
  { from: 24, to: 7, kind: 'snake' },
  { from: 36, to: 19, kind: 'snake' },
  { from: 44, to: 22, kind: 'snake' },
  { from: 47, to: 29, kind: 'snake' },
]

const SPECIALS_100: Record<number, TileKind> = {
  6: 'truth',
  15: 'truth',
  25: 'truth',
  35: 'truth',
  46: 'truth',
  56: 'truth',
  66: 'truth',
  75: 'truth',
  86: 'truth',
  95: 'truth',
  10: 'dare',
  18: 'dare',
  31: 'dare',
  42: 'dare',
  51: 'dare',
  64: 'dare',
  73: 'dare',
  82: 'dare',
  91: 'dare',
  98: 'dare',
  12: 'lucky',
  37: 'lucky',
  53: 'lucky',
  78: 'lucky',
  88: 'lucky',
  14: 'mystery',
  33: 'mystery',
  59: 'mystery',
  81: 'mystery',
  94: 'mystery',
  23: 'double',
  48: 'double',
  69: 'double',
  85: 'double',
  16: 'shield',
  43: 'shield',
  62: 'shield',
  89: 'shield',
}

const SPECIALS_50: Record<number, TileKind> = {
  5: 'truth',
  13: 'truth',
  25: 'truth',
  35: 'truth',
  43: 'truth',
  9: 'dare',
  17: 'dare',
  28: 'dare',
  38: 'dare',
  46: 'dare',
  11: 'lucky',
  31: 'lucky',
  42: 'lucky',
  6: 'mystery',
  23: 'mystery',
  41: 'mystery',
  12: 'double',
  37: 'double',
  15: 'shield',
  34: 'shield',
}

const STRIPES = ['#E5DBFF', '#FFD6E8', '#D0EBFF', '#D3F9D8', '#FFF3BF']

export function gridSize(size: BoardSize): { cols: number; rows: number } {
  return { cols: 10, rows: size / 10 }
}

/** Row 0 of rowFromBottom is the bottom row. Column 0 is the left edge. */
export function tileCoord(
  n: number,
  size: BoardSize,
): { rowFromBottom: number; col: number; rowFromTop: number } {
  const { cols, rows } = gridSize(size)
  const rowFromBottom = Math.floor((n - 1) / cols)
  const posInRow = (n - 1) % cols
  const col = rowFromBottom % 2 === 0 ? posInRow : cols - 1 - posInRow
  return { rowFromBottom, col, rowFromTop: rows - 1 - rowFromBottom }
}

export function tileAt(rowFromTop: number, col: number, size: BoardSize): number {
  const { cols, rows } = gridSize(size)
  const rowFromBottom = rows - 1 - rowFromTop
  const posInRow = rowFromBottom % 2 === 0 ? col : cols - 1 - col
  return rowFromBottom * cols + posInRow + 1
}

export function tileStripe(n: number): string {
  return STRIPES[(n - 1) % STRIPES.length] ?? STRIPES[0]
}

export function buildBoard(size: BoardSize): Board {
  const { cols, rows } = gridSize(size)
  const snakes = size === 100 ? SNAKES_100 : SNAKES_50
  const ladders = size === 100 ? LADDERS_100 : LADDERS_50
  const specials = size === 100 ? SPECIALS_100 : SPECIALS_50
  const portal = new Map<number, Portal>()
  for (const item of [...snakes, ...ladders]) portal.set(item.from, item)

  const tiles: Tile[] = []
  for (let n = 1; n <= size; n += 1) {
    const link = portal.get(n)
    let kind: TileKind = 'normal'
    let portalTo: number | undefined
    if (n === size) kind = 'finish'
    else if (link) {
      kind = link.kind
      portalTo = link.to
    } else if (specials[n]) kind = specials[n]
    tiles.push({ n, kind, portalTo })
  }

  return {
    size,
    cols,
    rows,
    tiles,
    snakes: snakes.map((item) => ({ ...item })),
    ladders: ladders.map((item) => ({ ...item })),
  }
}

const SPECIAL_KINDS = new Set<TileKind>(['truth', 'dare', 'lucky', 'mystery', 'double', 'shield'])

/** Structural checks so snakes, ladders, and events stay readable and loop-free. */
export function boardProblems(board: Board): string[] {
  const problems: string[] = []
  if (board.tiles.length !== board.size) problems.push('tile count')
  for (let i = 0; i < board.tiles.length; i += 1) {
    if (board.tiles[i]?.n !== i + 1) problems.push(`tile order ${i + 1}`)
  }

  const used = new Set<number>()
  const portals = [...board.snakes, ...board.ladders]
  for (const portal of portals) {
    if (portal.from < 2 || portal.from >= board.size || portal.to < 1 || portal.to >= board.size) {
      problems.push(`range ${portal.from}->${portal.to}`)
    }
    if (portal.kind === 'snake' && !(portal.to < portal.from)) problems.push(`snake dir ${portal.from}`)
    if (portal.kind === 'ladder' && !(portal.to > portal.from)) problems.push(`ladder dir ${portal.from}`)
    if (used.has(portal.from) || used.has(portal.to)) problems.push(`overlap ${portal.from}`)
    used.add(portal.from)
    used.add(portal.to)
  }

  const origins = new Set(portals.map((portal) => portal.from))
  for (const portal of portals) {
    if (origins.has(portal.to)) problems.push(`chain ${portal.from}->${portal.to}`)
  }

  for (const tile of board.tiles) {
    if (tile.n === board.size && tile.kind !== 'finish') problems.push('finish kind')
    if (tile.n === 1 && tile.kind !== 'normal') problems.push('start kind')
    if (tile.kind === 'snake' || tile.kind === 'ladder') {
      if (tile.portalTo == null) problems.push(`portal missing ${tile.n}`)
      const portal = portals.find((item) => item.from === tile.n && item.kind === tile.kind)
      if (!portal || portal.to !== tile.portalTo) problems.push(`portal mismatch ${tile.n}`)
    }
    if (SPECIAL_KINDS.has(tile.kind) && used.has(tile.n)) problems.push(`special on portal ${tile.n}`)
  }

  for (const portal of portals) {
    const dest = board.tiles[portal.to - 1]
    if (!dest || dest.kind !== 'normal') problems.push(`dest not clear ${portal.to}`)
  }

  return problems
}
