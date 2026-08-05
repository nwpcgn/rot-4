<script lang="ts">
	import '$game/game.css'
	import { logger } from '$lib/components/logger.svelte.ts'
	import Log from '$lib/components/Log.svelte'
	// import { Howl, Howler } from 'howler'
	import { Icon, sleep } from '$lib'
	import { onMount } from 'svelte'

	/* ============================================================
	   TYPES
	   ============================================================ */

	type Orientation = 'horizontal' | 'vertical'
	type ShipId = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer'
	type Player = 'human' | 'enemy'

	// Ablauf des Spiels: Schiffe setzen -> bereit -> Gefecht -> Ergebnis
	type GamePhase = 'placement' | 'ready' | 'play' | 'result'

	// KI-Verhalten: 'search' schießt zufällig, 'hunt' sucht gezielt
	// die Nachbarn eines Treffers ab, bis das Schiff versenkt ist
	type AiMode = 'search' | 'hunt'

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
	}

	const logText = async (message = '', type = 'info', timeout = 6000) => {
		logger.add({
			message,
			type,
			dismissible: true,
			timeout
		})
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
	function fireAt(
		board: Board,
		ships: Ship[],
		x: number,
		y: number
	): FireResult {
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

		return { hit: true, alreadyFired: false }
	}

	function isFleetDestroyed(ships: Ship[]): boolean {
		return ships.every((s) => s.sunk)
	}

	// Die 4 orthogonalen Nachbarn einer Zelle (kein Diagonal, Schiffe liegen gerade),
	// gefiltert auf gültige Grid-Koordinaten
	function getOrthogonalNeighbors(x: number, y: number, size: number): Coord[] {
		return [
			{ x: x + 1, y },
			{ x: x - 1, y },
			{ x, y: y + 1 },
			{ x, y: y - 1 }
		].filter((c) => c.x >= 0 && c.x < size && c.y >= 0 && c.y < size)
	}

	/* ============================================================
	   STATE
	   ============================================================ */

	// Spielablauf: Phase, wer am Zug ist, wer gewonnen hat
	let gameState: GameState = $state({
		phase: 'placement',
		turn: 'human',
		winner: null
	})

	// Eigenes Board & eigene Flotte
	let heroBoard: Board = $state(createBoard())
	let heroShips: Ship[] = $state([])

	// Gegner-Board & Gegner-Flotte (zufällig generiert, sobald eigene Flotte steht)
	let enemyBoard: Board = $state(createBoard())
	let enemyShips: Ship[] = $state([])

	// KI-Zielverfolgung: Modus + Warteschlange der als nächstes zu probierenden Felder
	let aiMode: AiMode = $state('search')
	let aiTargetQueue: Coord[] = $state([])

	// Platzierungs-UI-State
	let orientation: Orientation = $state('horizontal')
	let selectedShipId: ShipId | null = $state(SHIP_DEFS[0].id)
	let selectedEnemyId: ShipId | null = $state()
	let hoveredCell: Coord | null = $state(null)

	/* ============================================================
	   ABGELEITETER STATE
	   ============================================================ */

	// Flotten-Liste für die Sidebar: Stammdaten + Platzierungs-/Versenkt-Status
	let fleetEntries: FleetEntry[] = $derived(
		SHIP_DEFS.map((def) => {
			const placedShip = heroShips.find((s) => s.id === def.id)
			return {
				id: def.id,
				name: def.name,
				length: def.length,
				placed: placedShip !== undefined,
				sunk: placedShip?.sunk ?? false
			}
		})
	)

	let enemyEntries: FleetEntry[] = $derived(
		SHIP_DEFS.map((def) => {
			const placedShip = enemyShips.find((s) => s.id === def.id)
			return {
				id: def.id,
				name: def.name,
				length: def.length,
				placed: placedShip !== undefined,
				sunk: placedShip?.sunk ?? false
			}
		})
	)

	let heroLosts = $derived(
		heroShips.reduce((accumulator, currentValue) => {
			let value = accumulator
			if (currentValue.sunk) value++
			return value
		}, 0)
	)
	let enemyLosts = $derived(
		enemyShips.reduce((accumulator, currentValue) => {
			let value = accumulator
			if (currentValue.sunk) value++
			return value
		}, 0)
	)

	// Nächstes noch nicht platziertes Schiff (wird nach jeder Platzierung automatisch ausgewählt)
	let nextUnplacedId: ShipId | null = $derived(
		fleetEntries.find((e) => !e.placed)?.id ?? null
	)

	// Preview-Zellen für das aktuell gehoverte Feld, inkl. Gültigkeitsprüfung.
	// Reagiert automatisch auf Änderungen an hoveredCell, selectedShipId, orientation, heroBoard.
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
		const valid = isValidPlacement(cells, heroBoard)

		return cells.map((cell) => ({ ...cell, valid }))
	})

	// Schneller Lookup fürs Template (x,y -> gültig/ungültig), statt bei jeder
	// Zelle previewCells.find(...) aufzurufen
	let previewMap: Map<string, boolean> = $derived(
		new Map(previewCells.map((c) => [`${c.x},${c.y}`, c.valid]))
	)

	/* ============================================================
	   PLATZIERUNGSPHASE
	   ============================================================ */

	function attemptPlace(x: number, y: number) {
		const shipDef = SHIP_DEFS.find((s) => s.id === selectedShipId)
		if (!shipDef) return

		const newShip = placeShip(heroBoard, x, y, shipDef, orientation)
		if (!newShip) return // ungültige Position, nichts tun

		heroShips = [...heroShips, newShip]
		selectedShipId = nextUnplacedId

		// Alle Schiffe gesetzt? -> Gegner-Flotte generieren und in die "ready"-Phase wechseln
		if (heroShips.length === SHIP_DEFS.length) {
			gameState.phase = 'ready'
			setupEnemy()
		}
	}

	function toggleDir() {
		orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal'
	}

	function setupEnemy() {
		const result = generateRandomBoard(SHIP_DEFS)
		enemyBoard = result.board
		enemyShips = result.ships
	}

	async function setupHero() {
		const result = generateRandomBoard(SHIP_DEFS)
		heroBoard = result.board
		heroShips = result.ships
		await sleep(600)
		if (heroShips.length === SHIP_DEFS.length) {
			logText(
				'Schiffe wurden automatisch plaziert. Drücken sie die Start Taste.',
				'success'
			)
			gameState.phase = 'ready'
			setupEnemy()
		}
	}

	// Startet das Gefecht, sobald der Spieler seine Flotte bestätigt hat
	function startBattle() {
		if (gameState.phase !== 'ready') return
		gameState.phase = 'play'
	}

	/* ============================================================
	   GEFECHTSPHASE
	   ============================================================ */

	function handlePlayerShot(x: number, y: number) {
		if (gameState.phase !== 'play' || gameState.turn !== 'human') return

		const result = fireAt(enemyBoard, enemyShips, x, y)
		if (result.alreadyFired) return // Feld schon beschossen, ignorieren

		if (isFleetDestroyed(enemyShips)) {
			gameState.winner = 'human'
			gameState.phase = 'result'
			return
		}

		// Bei Treffer darf man (klassische Regel) nochmal schießen, sonst Zugwechsel
		if (!result.hit) {
			gameState.turn = 'enemy'
			setTimeout(enemyTurn, 600) // kleine Verzögerung, wirkt weniger abrupt
		}
	}

	// Wählt das nächste Ziel der KI:
	// - im Hunt-Modus: nächstes unbeschossenes Feld aus der Warteschlange
	//   (Nachbarn eines vorherigen Treffers), fällt auf Search zurück sobald leer
	// - im Search-Modus: zufälliges unbeschossenes Feld
	function pickAiTarget(): Coord {
		while (aiMode === 'hunt' && aiTargetQueue.length > 0) {
			const next = aiTargetQueue[aiTargetQueue.length - 1]
			aiTargetQueue = aiTargetQueue.slice(0, -1)
			if (!heroBoard[next.y][next.x].hit) return next
		}
		aiMode = 'search' // Warteschlange leer/erschöpft -> zurück in den Suchmodus

		let x: number, y: number
		do {
			x = Math.floor(Math.random() * SIZE)
			y = Math.floor(Math.random() * SIZE)
		} while (heroBoard[y][x].hit)
		return { x, y }
	}

	// KI mit Hunt-Modus: schießt normalerweise zufällig (search), wechselt nach
	// einem Treffer aber in den Hunt-Modus und sucht gezielt die Nachbarfelder ab,
	// bis das getroffene Schiff versenkt ist.
	function enemyTurn() {
		if (gameState.phase !== 'play') return

		const { x, y } = pickAiTarget()
		const result = fireAt(heroBoard, heroShips, x, y)

		if (isFleetDestroyed(heroShips)) {
			gameState.winner = 'enemy'
			gameState.phase = 'result'
			return
		}

		if (result.hit) {
			const hitShip = heroShips.find((s) =>
				s.cells.some((c) => c.x === x && c.y === y)
			)

			if (hitShip?.sunk) {
				// Schiff komplett versenkt -> zurück in den Suchmodus
				aiMode = 'search'
				aiTargetQueue = []
			} else {
				// Getroffen, aber noch nicht versenkt -> Nachbarn ins Visier nehmen
				aiMode = 'hunt'
				const neighbors = getOrthogonalNeighbors(x, y, SIZE).filter(
					(c) => !heroBoard[c.y][c.x].hit
				)
				aiTargetQueue = [...aiTargetQueue, ...neighbors]
			}
			setTimeout(enemyTurn, 600)
		} else {
			gameState.turn = 'human'
		}
	}

	/* ============================================================
	   RESET
	   ============================================================ */

	function gameReset() {
		gameState = { phase: 'placement', turn: 'human', winner: null }
		heroBoard = createBoard()
		heroShips = []
		enemyBoard = createBoard()
		enemyShips = []
		orientation = 'horizontal'
		selectedShipId = SHIP_DEFS[0].id
		hoveredCell = null
		aiMode = 'search'
		aiTargetQueue = []
	}

	onMount(() => gameReset())

	const CELL_SIZE = 32 // px, muss zu deinem CSS passen
	const GAP = 1 // px, dein grid-gap
	const STEP = CELL_SIZE + GAP

	interface ShipRect {
		left: number
		top: number
		width: number
		height: number
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
	let previewRect = $derived.by((): (ShipRect & { valid: boolean }) | null => {
		if (!hoveredCell || !selectedShipId) return null

		const shipDef = SHIP_DEFS.find((s) => s.id === selectedShipId)
		if (!shipDef) return null

		const cells = getShipCells(
			hoveredCell.x,
			hoveredCell.y,
			shipDef.length,
			orientation
		)
		const valid = isValidPlacement(cells, heroBoard)
		const rect = getShipRect(
			hoveredCell.x,
			hoveredCell.y,
			shipDef.length,
			orientation
		)

		return { ...rect, valid }
	})

	let shipRects = $derived(
		heroShips.map((ship) => ({
			id: ship.id,
			...getShipRect(
				ship.cells[0].x,
				ship.cells[0].y,
				ship.length,
				ship.orientation
			)
		}))
	)
</script>

<main class="main">
	<section class="page nwp items-center gap-4">
		<header class="text-center">
			<h4>Battleship</h4>
			<div class="uppercase">PHASE: {gameState.phase}</div>
			<div
				class="mt-2 flex justify-center gap-4"
				class:opacity-0={gameState.phase === 'placement'}>
				<span
					class="transition-color badge duration-300 ease-in"
					class:badge-accent={gameState.turn === 'human'}>Hero</span>
				<span
					class="transition-color badge duration-300 ease-in"
					class:badge-primary={gameState.turn !== 'human'}>Enemy</span>
			</div>
		</header>

		<div
			class="grid grid-cols-2 gap-4"
			style="--tile-size:{CELL_SIZE}px;--tile-gap:{GAP}px;">
			<section class="stacker">
				<div class="ship-grid active relative">
					{@render bars()}
					<div
						class="ship-map"
						class:inactive={gameState.phase === 'play' &&
							gameState.turn === 'human'}>
						{@render main1()}

						<div class="ship-overlay">
							{#each shipRects as rect (rect.id)}
								<div
									class="ship-block opacity-25"
									style="left:{rect.left}px; top:{rect.top}px; width:{rect.width}px; height:{rect.height}px;">
								</div>
							{/each}

							<!-- Preview-Rechteck -->
							{#if previewRect}
								<div
									class="preview-block"
									class:valid={previewRect.valid}
									class:invalid={!previewRect.valid}
									style="left:{previewRect.left}px; top:{previewRect.top}px; width:{previewRect.width}px; height:{previewRect.height}px;">
								</div>
							{/if}
						</div>
					</div>
				</div>
			</section>
			<section class="stacker">
				<div
					class="ship-grid"
					class:active={gameState.phase === 'ready' ||
						gameState.phase === 'play'}>
					{@render bars()}
					<div
						class="ship-map"
						class:inactive={gameState.phase === 'play' &&
							gameState.turn === 'enemy'}>
						{@render main2()}
					</div>
				</div>
				<div
					class="flex flex-col gap-2 rounded-box bg-base-200"
					class:active={gameState.phase === 'placement'}>
					<nav class="grid gap-1 px-2 py-1">
						<header class="split">
							<h5>Flotte</h5>
						</header>

						<hr />
						{#each fleetEntries as entry (entry.id)}
							{@render row1(entry)}
						{/each}
					</nav>
					<hr />
					{@render bar1()}
					<!-- <div class="flex flex-col items-center justify-center p-2">
						<button
							class="btn btn-circle btn-neutral"
							onclick={toggleDir}
							aria-label="Toggle Direction">
							<Icon
								sm
								icon={orientation !== 'horizontal' ? 'icon-row' : 'icon-col'} />
						</button>
						<span class="text-xs"
							>{orientation !== 'horizontal' ? 'Vert' : 'Horz'}</span>
					</div> -->
					<div class="flex flex-col items-center justify-center p-2">
						<button class="btn btn-neutral" onclick={setupHero}
							>Autofill</button>
					</div>

					<span class="flex-1"></span>
				</div>
			</section>
			<footer class="stacker">
				<div
					class="rounded-box border border-base-300"
					class:active={gameState.phase === 'play'}>
					{@render card1('Flotte', fleetEntries, true)}
				</div>
			</footer>
			<footer class="stacker">
				<div
					class="rounded-box border border-base-300"
					class:active={gameState.phase === 'play'}>
					{@render card1('Enemy', enemyEntries, false)}
				</div>
			</footer>
		</div>
	</section>

	{#if gameState.phase === 'ready'}
		<section class="page nwp center bg-base-300/10">
			<div class="p-4">
				<button class="bbtn-wide btn btn-primary btn-xl" onclick={startBattle}
					>Gefecht starten</button>
			</div>
		</section>
	{/if}

	{#if gameState.phase === 'result'}
		<section class="page nwp center bg-base-300/80">
			<div class="rounded-box bg-base-100 p-16">
				<h3>
					{gameState.winner === 'human'
						? 'Sieg! Flotte des Gegners versenkt.'
						: 'Niederlage – deine Flotte wurde versenkt.'}
				</h3>
				<nav>
					<div class="flex flex-col items-center gap-2">
						<button
							class="btn btn-circle btn-error"
							onclick={gameReset}
							aria-label="Reset">
							<Icon sm icon="icon-rotate-l" />
						</button>
						<span class="text-xs">Reset</span>
					</div>
				</nav>
			</div>
		</section>
	{/if}

	<aside class="aside p-2">
		<Log></Log>
	</aside>
</main>

{#snippet shipOverlay()}
	<div class="ship-overlay">
		{#each shipRects as rect (rect.id)}
			<div
				class="ship-block opacity-25"
				style="left:{rect.left}px; top:{rect.top}px; width:{rect.width}px; height:{rect.height}px;">
			</div>
		{/each}

		<!-- Preview-Rechteck -->
		{#if previewRect}
			<div
				class="preview-block"
				class:valid={previewRect.valid}
				class:invalid={!previewRect.valid}
				style="left:{previewRect.left}px; top:{previewRect.top}px; width:{previewRect.width}px; height:{previewRect.height}px;">
			</div>
		{/if}
	</div>
{/snippet}

{#snippet card2()}
	<div class="padded rounded-box bg-base-100 shadow">
		{@render bar1()}
	</div>
{/snippet}

{#snippet bar1()}
	<div class="flex justify-center gap-4 px-4">
		<div class="flex flex-col items-center gap-2">
			<button
				class="btn btn-circle btn-neutral"
				onclick={toggleDir}
				aria-label="Toggle Direction">
				<Icon
					sm
					icon={orientation !== 'horizontal' ? 'icon-row' : 'icon-col'} />
			</button>
			<span class="text-xs"
				>{orientation !== 'horizontal' ? 'Vert' : 'Horz'}</span>
		</div>
		<div class="flex flex-col items-center gap-2">
			<button
				class="btn btn-circle btn-error"
				onclick={gameReset}
				aria-label="Reset">
				<Icon sm icon="icon-rotate-l" />
			</button>
			<span class="text-xs">Reset</span>
		</div>
	</div>
{/snippet}

{#snippet card1(title = 'Flotte', data = [], bool = false)}
	<div class="padded rounded-box bg-base-100 shadow">
		<nav class="grid">
			<header class="split">
				<h5>{title}</h5>
				{#if !bool}
					<span class="text-accent">Sunk: {enemyLosts}</span>
				{:else}
					<span class="text-accent">Sunk: {heroLosts}</span>
				{/if}
			</header>
			<hr class="mb-1" />
			{#each data as entry (entry.id)}
				{#if !bool}
					{@render row2(entry)}
				{:else}
					{@render row1(entry)}
				{/if}
			{/each}
		</nav>
	</div>
{/snippet}

{#snippet row1({ id, name, length, placed, sunk })}
	<button
		class="split cursor-pointer"
		class:text-accent={id === selectedShipId}
		class:text-primary={placed && !sunk}
		class:text-error={sunk}
		onclick={() => {
			if (!placed) selectedShipId = id
		}}>
		<b>{name}</b>
		<!-- <span class="flex gap-0.5">{'▮'.repeat(length)}</span> -->
		<img src="/img/ship/{id}.png" class="h-[20px]" alt="" />
	</button>
{/snippet}

{#snippet row2({ id, name, length, placed, sunk })}
	{@const selected = id === selectedEnemyId}
	<button
		class="split cursor-pointer"
		class:text-accent={selected}
		class:text-primary={placed && !sunk && !selected}
		class:text-error={sunk}
		onclick={() => {
			selectedEnemyId = id

			console.log(enemyShips.find((d) => d.id === id))
		}}>
		<b>{name}</b>

		<span class="flex gap-0.5">{'▮'.repeat(length)}</span>
	</button>
{/snippet}

{#snippet bars(className = 'bg-base-300 font-semibold')}
	<div class="bar-h">
		{#each Array.from({ length: SIZE }, (_, i) => i) as item, x (x)}
			<span class={className}>
				{String.fromCharCode(65 + x)}
			</span>
		{/each}
	</div>
	<div class="bar-v">
		{#each Array.from({ length: SIZE }, (_, i) => i) as item, y (y)}
			<span class={className}>
				{y + 1}
			</span>
		{/each}
	</div>
{/snippet}

{#snippet main1()}
	{#each heroBoard as row, y}
		{#each row as cell, x}
			{@const preview = previewMap.get(`${x},${y}`)}
			<button
				class="cell"
				class:ship={cell.ship !== null}
				class:hit-miss={cell.hit && cell.ship === null}
				class:hit-ship={cell.hit && cell.ship !== null}
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
			<button
				class="cell"
				// class:ship={cell.ship !== null}
				class:hit-miss={cell.hit && cell.ship === null}
				class:hit-ship={cell.hit && cell.ship !== null}
				disabled={cell.hit ||
					gameState.phase !== 'play' ||
					gameState.turn !== 'human'}
				onclick={() => {
					handlePlayerShot(x, y)
				}}></button>
		{/each}
	{/each}
{/snippet}
