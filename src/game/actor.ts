import type { Actor, Position, Stats } from './types'

// Ist der Actor noch am Leben?

export function isAlive(actor: Actor): boolean {
	return actor.stats.hp > 0
}

// Schaden nehmen — Verteidigung wird abgezogen, mindestens 1 Schaden

export function takeDamage(actor: Actor, amount: number): number {
	const dmg = Math.max(1, amount - actor.stats.def)
	actor.stats.hp = Math.max(0, actor.stats.hp - dmg)
	return dmg // gibt tatsächlichen Schaden zurück (für Log)
}

// Heilen

export function heal(actor: Actor, amount: number): number {
	const before = actor.stats.hp
	actor.stats.hp = Math.min(actor.stats.maxHp, actor.stats.hp + amount)
	return actor.stats.hp - before // gibt tatsächlich geheilte HP zurück
}

// Chebyshev-Distanz: in Roguelikes standard (diagonal = 1 Schritt)

export function distanceTo(a: Position, b: Position): number {
	return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
}

// Sind zwei Positionen benachbart (inkl. diagonal)?

export function isAdjacent(a: Position, b: Position): boolean {
	return distanceTo(a, b) <= 1
}

// Einen Schritt in Richtung Ziel — gibt dx/dy zurück

export function stepToward(from: Position, to: Position): Position {
	return {
		x: Math.sign(to.x - from.x),
		y: Math.sign(to.y - from.y)
	}
}
