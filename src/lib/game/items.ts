import type { Player } from './types'
import { heal } from './actor'

export type Item = {
	name: string
	char: string
	color: string
	effect: 'hp' | 'atk' | 'def' | 'gold' | 'map'
	value: number
	desc: string
}

export const ITEM_TYPES: Record<string, Item> = {
	POTION: {
		name: 'Heiltrank',
		char: '!',
		color: '#d946ef',
		effect: 'hp',
		value: 30,
		desc: 'Stellt 30 HP wieder her.'
	},
	SWORD: {
		name: 'Schwert',
		char: '/',
		color: '#94a3b8',
		effect: 'atk',
		value: 5,
		desc: '+5 Angriff (diese Etage).'
	},
	GOLD: {
		name: 'Gold',
		char: '*',
		color: '#fbbf24',
		effect: 'gold',
		value: 10,
		desc: '10 Goldmünzen.'
	}
}

export function randomItem(): Item {
	const keys = Object.keys(ITEM_TYPES)
	return ITEM_TYPES[keys[Math.floor(Math.random() * keys.length)]]
}

// Effekt eines Items auf den Spieler anwenden
// Gibt einen Log-String zurück
export function useItem(item: Item, player: Player): string {
	switch (item.effect) {
		case 'hp': {
			const gained = heal(player, item.value)
			return `${item.name} benutzt → +${gained} HP`
		}
		case 'atk':
			player.stats.atk += item.value
			return `${item.name} ausgerüstet → +${item.value} ATK`
		case 'def':
			player.stats.def += item.value
			return `${item.name} ausgerüstet → +${item.value} DEF`
		case 'gold':
			return `${item.name} eingesammelt → +${item.value} Gold`
		default:
			return `${item.name} benutzt.`
	}
}
