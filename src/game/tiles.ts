export const colors = {
	dark: 'oklch(14.5% 0 0)',
	bg: 'oklch(20.5% 0 0)',
	accent: 'oklch(37.2% 0.044 257.287)',
	door2: 'oklch(37.2% 0.044 257.287)',
	door1: 'oklch(0.35 0 0)',
	surface: 'oklch(26.9% 0 0)',
	text: 'oklch(92.2% 0 0)',
	primary: 'oklch(86.645% 0.29481 142.511)',
	success: 'oklch(0.7588 0.2948 142.51)',
	error: 'oklch(57.7% 0.245 27.325)',
	warning: 'oklch(87.9% 0.169 91.605)',
	info: 'oklch(68.5% 0.169 237.323)'
}

export const TILE = {
	FLOOR: 0,
	WALL: 1,
	DOOR_CLOSED: 2,
	DOOR_OPEN: 3,
	STAIRS: 4
} as const

export type TileId = (typeof TILE)[keyof typeof TILE]

export type TileDef = {
	name: string
	char: string
	style: { fg: string; bg: string }
	walkable: boolean
	lightPass: boolean
	hasAction: boolean
}

export const TILE_DEFS: Record<TileId, TileDef> = {
	[TILE.FLOOR]: {
		name: 'floor',
		char: '.',
		style: { fg: colors.warning, bg: colors.accent },
		walkable: true,
		lightPass: true,
		hasAction: false
	},
	[TILE.WALL]: {
		name: 'wall',
		char: '#',
		style: { fg: colors.text, bg: colors.surface },
		walkable: false,
		lightPass: false,
		hasAction: false
	},
	[TILE.DOOR_CLOSED]: {
		name: 'door-closed',
		char: '+',
		style: { fg: colors.error, bg: colors.door1 },
		walkable: false,
		lightPass: false,
		hasAction: true
	},
	[TILE.DOOR_OPEN]: {
		name: 'door-open',
		char: '+',
		style: { fg: colors.success, bg: colors.door2 },
		walkable: true,
		lightPass: true,
		hasAction: false
	},
	[TILE.STAIRS]: {
		name: 'stairs',
		char: 's',
		style: { fg: colors.success, bg: colors.accent },
		walkable: true,
		lightPass: true,
		hasAction: true
	}
}
