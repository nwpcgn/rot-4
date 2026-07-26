import randRow from './randRow'
import uuid from './uuid'
import randNum from './randNum'
import db from './db.json'
const m = db.moves
const h = db.heros
export interface FighterType {
	id: string
	name: string
	info: string
	hp: number
	maxHp: number
	atc: number
	def: number
	level: number
	img: string
	avatar: string
	moves?: Move[] | null
}
export interface Move {
	name: string
	dice: number
	damage: number
	info: string
}

function getRandMoves(arr = [], num = 2) {
	const chosen = new Set()

	while (chosen.size < num) {
		const randomItem = arr[Math.floor(Math.random() * arr.length)]
		chosen.add(randomItem)
	}

	return [...chosen]
}
export function getFighter(): FighterType {
	const fighter = h[randRow(h)]

	const id = uuid()
	const health = randNum(24, 28)
	const defaults = {
		id,
		name: '',
		info: '',
		hp: health,
		maxHp: health,
		atc: randNum(6, 9),
		def: randNum(3, 6),
		level: randNum(1, 3)
	}
	const moves: Move = getRandMoves(m, 2)
	const hero = { ...defaults, ...fighter, moves }
	return hero
}
export default getFighter
