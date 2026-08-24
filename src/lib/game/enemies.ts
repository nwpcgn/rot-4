import * as ROT from 'rot-js'
import { isDebugging } from './options'
import type { Enemy, Player } from './types'
import { takeDamage, distanceTo, stepToward, isAlive } from './actor'
import { TILE, TILE_DEFS, type TileId } from './tiles'

// ─── Enemy-Definitionen ──────────────────────────────────────
// Wie ITEM_TYPES / TILE_DEFS: Daten getrennt von Logik

export const ENEMY_TYPES = {
	RAT: {
		name: 'Ratte',
		char: 'r',
		color: '#a78bfa',
		stats: { hp: 8, maxHp: 8, atk: 3, def: 0 },
		behavior: 'chase' as const,
		xp: 5,
		sightRange: 6
	},
	ORC: {
		name: 'Ork',
		char: 'o',
		color: '#f97316',
		stats: { hp: 20, maxHp: 20, atk: 5, def: 2 },
		behavior: 'chase' as const,
		xp: 15,
		sightRange: 8
	},
	TROLL: {
		name: 'Troll',
		char: 'T',
		color: '#4ade80',
		stats: { hp: 30, maxHp: 30, atk: 6, def: 3 },
		behavior: 'chase' as const,
		xp: 30,
		sightRange: 5
	}
} as const

let nextEnemyId = 100

// Einen Enemy aus einem Typ erstellen

export function createEnemy(
	typeKey: keyof typeof ENEMY_TYPES,
	x: number,
	y: number
): Enemy {
	const def = ENEMY_TYPES[typeKey]
	return {
		id: nextEnemyId++,
		...def,
		// Stats tief kopieren — sonst teilen alle Ratten dieselben HP!
		stats: { ...def.stats },
		pos: { x, y }
	}
}

// ─── KI ──────────────────────────────────────────────────────

// Kann der Enemy auf diese Position laufen?

function canMoveTo(
	x: number,
	y: number,
	map: TileId[][],
	enemies: Enemy[]
): boolean {
	const tile = map[y]?.[x]
	if (tile === undefined) return false
	if (!TILE_DEFS[tile].walkable) return false
	// Kein anderer Enemy steht dort
	return !enemies.some((e) => e.pos.x === x && e.pos.y === y)
}

// enemies.ts — enemyTurn gibt neue Position zurück, mutiert nicht

export function enemyTurn(
	enemy: Enemy,
	player: Player,
	map: TileId[][],
	enemies: Enemy[],
	log: (msg: string) => void
): Partial<Enemy> | null {
	if (!isAlive(enemy)) return null

	const dist = distanceTo(enemy.pos, player.pos)
	if (dist > enemy.sightRange) return null

	if (dist <= 1) {
		const dmg = takeDamage(player, enemy.stats.atk)
		log(`${enemy.name} trifft dich für ${dmg} Schaden!`)
		return null // Position ändert sich nicht
	}

	const step = stepToward(enemy.pos, player.pos)
	const nx = enemy.pos.x + step.x
	const ny = enemy.pos.y + step.y

	if (isDebugging)
		console.log('enemyTurn:', enemy.name, 'hp:', enemy.stats.hp, 'dist:', dist)

	if (canMoveTo(nx, ny, map, enemies)) {
		return { pos: { x: nx, y: ny } } // ← nur zurückgeben, nicht mutieren
	}
	return null
}

// allEnemiesTurn gibt ein neues Array zurück

export function allEnemiesTurn(
	enemies: Enemy[],
	player: Player,
	map: TileId[][],
	log: (msg: string) => void
): Enemy[] {
	return enemies.map((enemy) => {
		const update = enemyTurn(enemy, player, map, enemies, log)
		if (!update) return enemy
		return { ...enemy, ...update } // ← neues Objekt, kein Mutieren
	})
}

// Enemies in Räumen platzieren

export function spawnEnemies(rooms: ROT.Map.Room[], map: TileId[][]): Enemy[] {
	const enemyTypes = Object.keys(ENEMY_TYPES) as (keyof typeof ENEMY_TYPES)[]
	const result: Enemy[] = []

	rooms.forEach((room, i) => {
		// Ersten Raum freilassen (Startposition des Spielers)
		if (i === 0) return
		if (Math.random() > 0.6) return

		const x = ROT.RNG.getUniformInt(room.x, room.x + room.width)
		const y = ROT.RNG.getUniformInt(room.y, room.y + room.height)

		// Nur spawnen wenn Tile frei
		if (map[y]?.[x] !== TILE.FLOOR) return

		const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]
		result.push(createEnemy(type, x, y))
	})

	return result
}
