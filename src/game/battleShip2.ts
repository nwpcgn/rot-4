/* ============================================================
   TYPES
   ============================================================ */

type Orientation = 'horizontal' | 'vertical'
type ShipId = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer'
type Player = 'human' | 'enemy'

// Ablauf des Spiels: Schiffe setzen -> bereit -> Gefecht -> Ergebnis
type GamePhase = 'placement' | 'ready' | 'play' | 'result'

interface Coord {
	x: number
	y: number
}

// Eine Zelle im Grid: welches Schiff liegt hier (falls überhaupt),
// und wurde bereits darauf geschossen?
interface Cell {
	ship: ShipId | null
	hit: boolean
}

// board[y][x] - Zeile zuerst, dann Spalte
type Board = Cell[][]

// Stammdaten einer Schiffsklasse (unveränderlich, aus SHIP_DEFS)
interface ShipDef {
	id: ShipId
	name: string
	length: number
}

// Ein tatsächlich platziertes Schiff inkl. Zellen & Status
interface Ship {
	id: ShipId
	length: number
	cells: Coord[]
	orientation: Orientation
	sunk: boolean
}

// Für die Flotten-Liste in der Sidebar: Stammdaten + abgeleiteter Status
interface FleetEntry {
	id: ShipId
	name: string
	length: number
	placed: boolean
	sunk: boolean
}

// Preview-Zelle beim Hovern während der Platzierungsphase
interface PreviewCell extends Coord {
	valid: boolean
}

// Gesamter Spielzustand für die Gefechtsphase
interface GameState {
	phase: GamePhase
	turn: Player
	winner: Player | null
}

// Ergebnis eines Schusses
interface FireResult {
	hit: boolean
	alreadyFired: boolean
	shipId?: number | null
	shipSunk?: boolean
}
type AiMode = 'search' | 'hunt'

export {
	Orientation,
	ShipId,
	Player,
	GamePhase,
	Coord,
	Cell,
	Board,
	ShipDef,
	Ship,
	FleetEntry,
	PreviewCell,
	GameState,
	FireResult,
	AiMode
}

/* ============================================================
	   KONSTANTEN
	   ============================================================ */

const SIZE = 10
const SHIP_DEFS: ShipDef[] = [
	{ id: 'carrier', name: 'Carrier', length: 5 },
	{ id: 'battleship', name: 'Battleship', length: 4 },
	{ id: 'cruiser', name: 'Cruiser', length: 3 },
	{ id: 'submarine', name: 'Submarine', length: 3 },
	{ id: 'destroyer', name: 'Destroyer', length: 2 }
]

/* ============================================================
	   REINE FUNKTIONEN: BOARD & PLATZIERUNG
	   (kennen keinen State, nur ihre Parameter -> gut testbar)
	   ============================================================ */

function createBoard(size: number = SIZE): Board {
	// Array.from statt .fill(), da .fill() bei Objekten dieselbe
	// Referenz in jede Zelle schreiben würde (alle Zellen wären identisch)
	return Array.from({ length: size }, () =>
		Array.from({ length: size }, () => ({ ship: null, hit: false }))
	)
}

// Berechnet die vom Schiff belegten Koordinaten ausgehend vom Startpunkt
function getShipCells(
	startX: number,
	startY: number,
	length: number,
	orientation: Orientation
): Coord[] {
	const cells: Coord[] = []
	for (let i = 0; i < length; i++) {
		const x = orientation === 'horizontal' ? startX + i : startX
		const y = orientation === 'vertical' ? startY + i : startY
		cells.push({ x, y })
	}
	return cells
}

// Prüft, ob ein Schiff an dieser Position liegen darf:
// - innerhalb des Grids
// - Zellen selbst frei
// - optional: auch die 8 Nachbarzellen frei (Berührungsverbot)
function isValidPlacement(
	cells: Coord[],
	board: Board,
	noTouch: boolean = true
): boolean {
	const size = board.length

	const basicValid = cells.every(({ x, y }) => {
		if (x < 0 || x >= size || y < 0 || y >= size) return false
		return board[y][x].ship === null
	})

	if (!basicValid) return false
	if (!noTouch) return true

	return cells.every(({ x, y }) => {
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				if (dx === 0 && dy === 0) continue // die Zelle selbst schon geprüft

				const nx = x + dx
				const ny = y + dy

				if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue // außerhalb = ok
				if (board[ny][nx].ship !== null) return false
			}
		}
		return true
	})
}

// Platziert ein Schiff auf dem übergebenen Board (mutiert board bei Erfolg)
// und gibt das entstandene Ship-Objekt zurück, oder null bei ungültiger Position
function placeShip(
	board: Board,
	startX: number,
	startY: number,
	shipDef: ShipDef,
	orientation: Orientation
): Ship | null {
	const cells = getShipCells(startX, startY, shipDef.length, orientation)

	if (!isValidPlacement(cells, board)) {
		return null
	}

	cells.forEach(({ x, y }) => {
		board[y][x].ship = shipDef.id
	})

	return {
		id: shipDef.id,
		length: shipDef.length,
		cells,
		orientation,
		sunk: false
	}
}

/* ============================================================
	   REINE FUNKTIONEN: ZUFALLSPLATZIERUNG (Gegner-Flotte)
	   ============================================================ */

function randomOrientation(): Orientation {
	return Math.random() < 0.5 ? 'horizontal' : 'vertical'
}

function randomCoord(size: number): Coord {
	return {
		x: Math.floor(Math.random() * size),
		y: Math.floor(Math.random() * size)
	}
}

// Versucht ein einzelnes Schiff an zufälligen Positionen zu platzieren,
// bis es passt (maxAttempts als Sicherheitsbremse gegen Endlosschleifen)

function placeShipRandomly(
	board: Board,
	shipDef: ShipDef,
	maxAttempts: number = 500
): Ship | null {
	const size = board.length

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const { x, y } = randomCoord(size)
		const orientation = randomOrientation()

		const ship = placeShip(board, x, y, shipDef, orientation)
		if (ship) return ship
	}

	return null // sollte bei sinnvoller Board-Größe/Flotte nie passieren
}

// Erzeugt ein komplettes, zufällig bestücktes Board für die Gegner-KI
function generateRandomBoard(
	shipDefs: ShipDef[],
	size: number = SIZE
): { board: Board; ships: Ship[] } {
	const board = createBoard(size)
	const ships: Ship[] = []

	for (const shipDef of shipDefs) {
		const ship = placeShipRandomly(board, shipDef)
		if (!ship) {
			throw new Error(
				`Konnte ${shipDef.name} nicht platzieren – Board zu voll oder Flotte zu groß.`
			)
		}
		ships.push(ship)
	}

	return { board, ships }
}

/* ============================================================
	   REINE FUNKTIONEN: GEFECHT
	   ============================================================ */

// Verarbeitet einen Schuss auf eine Koordinate. Mutiert board/ships.
function fireAt(board: Board, ships: Ship[], x: number, y: number): FireResult {
	const cell = board[y][x]

	if (cell.hit) {
		return { hit: false, alreadyFired: true }
	}

	cell.hit = true

	if (cell.ship === null) {
		return { hit: false, alreadyFired: false }
	}

	// Treffer -> prüfen, ob dadurch das ganze Schiff versenkt ist
	const ship = ships.find((s) => s.id === cell.ship)
	const allHit =
		ship?.cells.every(({ x: cx, y: cy }) => board[cy][cx].hit) ?? false
	if (ship && allHit) {
		ship.sunk = true
	}

	return {
		hit: true,
		alreadyFired: false,
		shipId: ship.id,
		shipSunk: ship.sunk
	}
}

function isFleetDestroyed(ships: Ship[]): boolean {
	return ships.every((s) => s.sunk)
}

function getOrthogonalNeighbors(x: number, y: number, size: number): Coord[] {
	return [
		{ x: x + 1, y },
		{ x: x - 1, y },
		{ x, y: y + 1 },
		{ x, y: y - 1 }
	].filter((c) => c.x >= 0 && c.x < size && c.y >= 0 && c.y < size)
}

export {
	SIZE,
	SHIP_DEFS,
	createBoard,
	getShipCells,
	isValidPlacement,
	placeShip,
	randomCoord,
	randomOrientation,
	placeShipRandomly,
	generateRandomBoard,
	fireAt,
	isFleetDestroyed,
	getOrthogonalNeighbors
}
