// ─── Position ────────────────────────────────────────────────
export type Position = { x: number; y: number }

// ─── Stats ───────────────────────────────────────────────────
export type Stats = {
	hp: number
	maxHp: number
	atk: number
	def: number
}

// ─── Actor: Basis für Player und Enemy ───────────────────────
// Alles was sich auf der Map bewegt und kämpfen kann
export type Actor = {
	id: number
	name: string
	char: string
	color: string
	pos: Position
	stats: Stats
}

// ─── Player ──────────────────────────────────────────────────
export type Player = Actor & {
	inventory: import('./items').Item[]
}

// ─── Enemy ───────────────────────────────────────────────────
export type EnemyBehavior = 'idle' | 'chase' | 'flee'

export type Enemy = Actor & {
	behavior: EnemyBehavior
	xp: number
	sightRange: number
}

export interface RoomData {
	id: number
	x: number
	y: number
	width: number
	height: number
}
