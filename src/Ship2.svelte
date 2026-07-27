<script lang="ts">
	import { Icon } from '$lib'
	import { onMount } from 'svelte'

	// types.ts
	type Orientation = 'horizontal' | 'vertical'
	type ShipId = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer'
	interface FleetEntry {
		id: ShipId
		name: string
		length: number
		placed: boolean
		sunk: boolean
	}
	interface ShipDef {
		id: ShipId
		name: string
		length: number
	}

	interface Ship {
		id: ShipId
		length: number
		cells: Coord[]
		orientation: Orientation
		sunk: boolean
	}

	interface Cell {
		ship: string | null
		hit: boolean
	}

	interface Coord {
		x: number
		y: number
	}
	interface PreviewCell extends Coord {
		valid: boolean
	}
	type Board = Cell[][] // board[y][x]

	type PlacedShips = Record<string, Coord[]>
	interface ShipRect {
		left: number
		top: number
		width: number
		height: number
	}

	const SIZE = 10
	const SHIP_DEFS = [
		{ id: 'carrier', name: 'Carrier', length: 5 },
		{ id: 'battleship', name: 'Battleship', length: 4 },
		{ id: 'cruiser', name: 'Cruiser', length: 3 },
		{ id: 'submarine', name: 'Submarine', length: 3 },
		{ id: 'destroyer', name: 'Destroyer', length: 2 }
	]

	const CELL_SIZE = 32 // px, muss zu deinem CSS passen
	const GAP = 2 // px, dein grid-gap
	const STEP = CELL_SIZE + GAP
	/* --------------------------- generateRandomBoard -------------------------- */
	function randomOrientation(): Orientation {
		return Math.random() < 0.5 ? 'horizontal' : 'vertical'
	}

	function randomCoord(size: number): Coord {
		return {
			x: Math.floor(Math.random() * size),
			y: Math.floor(Math.random() * size)
		}
	}
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

	function generateRandomBoard(
		shipDefs: ShipDef[],
		size: number = 10
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
	/* ---------------------------------- BOARD --------------------------------- */
	function createBoard(size: number = 10): Board {
		return Array.from({ length: size }, () =>
			Array.from({ length: size }, () => ({ ship: null, hit: false }))
		)
	}

	function getShipRect(
		startX: number,
		startY: number,
		length: number,
		orientation: Orientation
	): ShipRect {
		const width =
			orientation === 'horizontal'
				? length * CELL_SIZE + (length - 1) * GAP
				: CELL_SIZE
		const height =
			orientation === 'vertical'
				? length * CELL_SIZE + (length - 1) * GAP
				: CELL_SIZE

		return {
			left: startX * STEP,
			top: startY * STEP,
			width,
			height
		}
	}

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

	function isValidPlacement(
		cells: Coord[],
		board: Board,
		noTouch: boolean = true
	): boolean {
		const size = board.length

		// 1. Grundprüfung: innerhalb des Grids & Zelle selbst frei
		const basicValid = cells.every(({ x, y }) => {
			if (x < 0 || x >= size || y < 0 || y >= size) return false
			return board[y][x].ship === null
		})

		if (!basicValid) return false
		if (!noTouch) return true

		// 2. Nachbarschaftsprüfung: keine der 8 Nachbarzellen darf ein Schiff sein
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

	function attemptPlace(x: number, y: number) {
		console.log(board[y][x])
		const shipDef = SHIP_DEFS.find((s) => s.id === selectedShipId)
		if (!shipDef) return

		const newShip = placeShip(board, x, y, shipDef, orientation)
		if (!newShip) {
			// ungültig
			return
		}

		ships = [...ships, newShip]
		placedShips[shipDef.id] = newShip.cells
		selectedShipId = nextUnplacedId

		if (Object.keys(placedShips).length === SHIP_DEFS.length) {
			status = 'ready'
			console.log('Setup Enemy')
			setupEnemy()
		}
	}

	let fleetEntries: FleetEntry[] = $derived(
		SHIP_DEFS.map((def) => {
			const placedShip = ships.find((s) => s.id === def.id)
			return {
				id: def.id,
				name: def.name,
				length: def.length,
				placed: placedShip !== undefined,
				sunk: placedShip?.sunk ?? false
			}
		})
	)

	let nextUnplacedId: ShipId | null = $derived(
		fleetEntries.find((e) => !e.placed)?.id ?? null
	)
	let status = $state('placement')
	let board: Board = $state(createBoard())
	let ships: Ship[] = $state([])
	let orientation: Orientation = $state('horizontal')
	let selectedShipId: string | null = $state(SHIP_DEFS[0].id)
	let placedShips: PlacedShips = $state({})
	let hoveredCell: Coord | null = $state(null)

	let enemyBoard: Board = $state(createBoard())
	let enemyShips: Ship[] = $state([])

	function setupEnemy() {
		const result = generateRandomBoard(SHIP_DEFS)
		enemyBoard = result.board
		enemyShips = result.ships
	}

	const gameReset = () => {
		placedShips = {}
		hoveredCell = null
		ships = []
		selectedShipId = SHIP_DEFS[0].id
		board = createBoard()
		status = 'placement'
		orientation = 'horizontal'
		enemyShips = []
		enemyBoard = createBoard()
	}

	let previewCells: PreviewCell[] = $derived.by(() => {
		if (!hoveredCell || !selectedShipId) return []

		const shipDef = SHIP_DEFS.find((s) => s.id === selectedShipId)
		if (!shipDef) return []

		const cells = getShipCells(
			hoveredCell.x,
			hoveredCell.y,
			shipDef.length,
			orientation
		)

		const valid = isValidPlacement(cells, board)

		return cells.map((cell) => ({ ...cell, valid }))
	})

	let previewMap: Map<string, boolean> = $derived(
		new Map(previewCells.map((c) => [`${c.x},${c.y}`, c.valid]))
	)

	const toggleDir = () => {
		orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal'
	}

	const createOpponentMap = () => {
		console.log('createOpponentMap')

		// z.B. beim Start der Angriffsphase aufrufen:
		setupEnemy()
	}

	onMount(() => gameReset())
</script>

<main class="main">
	<section class="page nwp items-center gap-4">
		<div class="text-center">
			<h3>Battleship</h3>
			<h6 class="uppercase">PHASE: {status}</h6>
		</div>

		<div class="ship-grid">
			{@render bars()}
			<div class="ship-map">
				{@render main1()}
			</div>
		</div>
		<div class="ship-grid">
			{@render bars()}
			<div class="ship-map">
				{@render main2()}
			</div>
		</div>
	</section>
	<aside class="aside p-2">
		<div class="padded rounded-box bg-base-100 shadow">
			<nav class="grid">
				<header class="split">
					<h4>Flotte</h4>
				</header>

				{#each fleetEntries as entry (entry.id)}
					<button
						class="split cursor-pointer"
						class:text-accent={entry.id === selectedShipId}
						class:text-primary={entry.placed}
						class:text-red={entry.sunk}
						onclick={() => {
							if (!entry.placed) selectedShipId = entry.id
						}}>
						<b>{entry.name}</b>
						<span class="flex gap-0.5">{'▮'.repeat(entry.length)}</span>
					</button>
				{/each}
			</nav>
		</div>
		<div class="split py-2">
			<div class="flex flex-col items-center gap-1">
				<span class="font-thin">Oriantation</span>
				<button class="btn btn-circle" onclick={toggleDir} aria-label="Toggle Oriantation">
					<Icon icon={orientation !== 'horizontal' ? 'icon-row' : 'icon-col'} />
				</button>
			</div>
			<div class="flex flex-col items-center gap-1">
				<span class="font-thin">Reset</span>
				<button class="btn btn-circle" onclick={gameReset} aria-label="Reset">
					<Icon icon="icon-rotate-l" />
				</button>
			</div>
		</div>

		<div>
			<label class="label">Ships</label>
			<textarea class="textarea" value={JSON.stringify(ships)}
			></textarea>
		</div>
		<div>
			<label class="label">PlacedShips</label>
			<textarea class="textarea" value={JSON.stringify(placedShips)}
			></textarea>
		</div>
	</aside>
</main>
{#snippet bars()}
	<div class="bar-h">
		{#each Array.from({ length: SIZE }, (_, i) => i) as item, x (x)}
			<span class="bg-base-300 font-bold">
				{String.fromCharCode(65 + x)}
			</span>
		{/each}
	</div>
	<div class="bar-v">
		{#each Array.from({ length: SIZE }, (_, i) => i) as item, y (y)}
			<span class="bg-base-300 font-bold">
				{y + 1}
			</span>
		{/each}
	</div>
{/snippet}

{#snippet main1()}
	{#each board as row, y}
		{#each row as cell, x}
			{@const preview = previewMap.get(`${x},${y}`)}
			<button
				class="cell"
				class:ship={cell.ship !== null}
				class:preview-ok={preview === true}
				class:preview-bad={preview === false}
				onmouseenter={() => (hoveredCell = { x, y })}
				onmouseleave={() => (hoveredCell = null)}
				onclick={() => attemptPlace(x, y)}></button>
		{/each}
	{/each}
{/snippet}
{#snippet main2()}
	{#each enemyBoard as row, y}
		{#each row as cell, x}
			<div class="cell" class:ship={cell.ship !== null}></div>
		{/each}
	{/each}
{/snippet}

<style>
	:root {
		--tile-size: 42px;

		--bg: #061620;
		--panel: #0a1f2e;
		--grid-line: #123344;
		--water: #082433;
		--sonar: #39ff8f;
		--sonar-dim: #1f6b47;
		--danger: #ff5c5c;
		--text: #d8f3e6;
		--text-dim: #6f9c8c;
		--amber: #ffb347;
	}

	.ship-grid {
		display: grid;
		grid-template-columns: var(--tile-size) 1fr;
		grid-template-rows: var(--tile-size) 1fr;
		gap: 0.25rem;
		grid-auto-flow: row;
		grid-template-areas:
			'. bar-h'
			'bar-v ship-map';
	}
	.bar-h {
		display: grid;
		grid-template-columns: repeat(10, minmax(var(--tile-size), 1fr));
		grid-template-rows: 1fr;
		grid-area: bar-h;
		gap: 1px;
	}
	.bar-v {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: repeat(10, minmax(var(--tile-size), 1fr));
		grid-area: bar-v;
		gap: 1px;
	}
	.ship-map {
		display: grid;
		grid-template-columns: repeat(10, minmax(var(--tile-size), 1fr));
		grid-template-rows: repeat(10, minmax(var(--tile-size), 1fr));
		grid-area: ship-map;
		gap: 1px;
	}
	.ship-map > *,
	.bar-v > *,
	.bar-h > * {
		display: grid;
		place-content: center;
		aspect-ratio: 1/1;
		width: var(--tile-size);
	}

	.cell {
		background: var(--water);
		position: relative;
		cursor: pointer;
		transition: background 0.2s ease;
	}
	.cell:hover {
		background: #0d3244;
	}
	.cell.ship {
		background: var(--sonar-dim);
	}
	.cell.ship::after {
		content: '';
		position: absolute;
		inset: 3px;
		border: 1px solid var(--sonar);
		opacity: 0.6;
	}
	.cell.preview-ok {
		background: oklch(0.508 0.118 165.612);
	}
	.cell.preview-bad {
		background: oklch(0.514 0.222 16.935);
	}
</style>
