import { Map as RotMap } from 'rot-js'

export const TILE = {
	FLOOR: 0,
	WALL: 1,
	DOOR_CLOSED: 2,
	DOOR_OPEN: 3,
	STAIRS: 4
} as const

export type Tile = (typeof TILE)[keyof typeof TILE]
export type DungeonAlgorithm = 'digger' | 'uniform' | 'rogue'

export interface Position {
	x: number
	y: number
}

export interface RoomData {
	id: number
	x: number
	y: number
	width: number
	height: number
}

export interface DungeonResult {
	tiles: Tile[][]
	rooms: RoomData[]
	corridorCount: number
	start: Position
	exit: Position
}

export interface DungeonOptions {
	width: number
	height: number
	algorithm: DungeonAlgorithm
	roomWidth?: [number, number]
	roomHeight?: [number, number]
	corridorLength?: [number, number]
	dugPercentage?: number
	roomDugPercentage?: number
}

export function generateDungeon(options: DungeonOptions): DungeonResult {
	const {
		width = 60,
		height = 40,
		algorithm = 'digger',
		roomWidth = [3, 9],
		roomHeight = [3, 6],
		corridorLength = [1, 5],
		dugPercentage = 0.25,
		roomDugPercentage = 0.15
	} = options

	// Initialize 2D array with walls
	const tiles: Tile[][] = Array.from({ length: height }, () =>
		Array(width).fill(TILE.WALL)
	)

	let mapGenerator:
		| InstanceType<typeof RotMap.Digger>
		| InstanceType<typeof RotMap.Uniform>
		| InstanceType<typeof RotMap.Rogue>

	switch (algorithm) {
		case 'digger':
			mapGenerator = new RotMap.Digger(width, height, {
				roomWidth,
				roomHeight,
				corridorLength,
				dugPercentage
			})
			break
		case 'uniform':
			mapGenerator = new RotMap.Uniform(width, height, {
				roomWidth,
				roomHeight,
				roomDugPercentage
			})
			break
		case 'rogue':
			mapGenerator = new RotMap.Rogue(width, height, {})
			break
	}

	// Generate map — 0 = floor, 1 = wall
	mapGenerator.create((x: number, y: number, value: number) => {
		tiles[y][x] = value === 0 ? TILE.FLOOR : TILE.WALL
	})

	// Extract rooms
	const rooms: RoomData[] = []
	let corridorCount = 0

	if ('getRooms' in mapGenerator) {
		mapGenerator.getRooms().forEach((room: any, index: number) => {
			const left = room.getLeft()
			const top = room.getTop()
			const right = room.getRight()
			const bottom = room.getBottom()

			rooms.push({
				id: index,
				x: left,
				y: top,
				width: right - left + 1,
				height: bottom - top + 1
			})

			// Place doors
			room.getDoors((dx: number, dy: number) => {
				tiles[dy][dx] = TILE.DOOR_CLOSED
			})
		})
	}

	if ('getCorridors' in mapGenerator) {
		const corridors = mapGenerator.getCorridors()
		corridorCount = corridors.length
	}

	// start = center of first room, exit = center of last room
	const firstRoom = rooms[0]
	const lastRoom = rooms[rooms.length - 1]

	const start: Position = firstRoom
		? {
				x: firstRoom.x + Math.floor(firstRoom.width / 2),
				y: firstRoom.y + Math.floor(firstRoom.height / 2)
			}
		: { x: 1, y: 1 }

	const exit: Position = lastRoom
		? {
				x: lastRoom.x + Math.floor(lastRoom.width / 2),
				y: lastRoom.y + Math.floor(lastRoom.height / 2)
			}
		: { x: width - 2, y: height - 2 }

	// Place stairs at exit position
	tiles[exit.y][exit.x] = TILE.STAIRS

	return { tiles, rooms, corridorCount, start, exit }
}
