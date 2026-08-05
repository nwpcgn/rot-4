<script lang="ts">
	import { logger } from '$lib/components/logger.svelte.ts'
	// import BattleGrid from './BattleGrid.svelte'
	import '$game/game.css'
	import { Howl, Howler } from 'howler'
	import { Icon, sleep } from '$lib'
	import { onMount } from 'svelte'
	import type {
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
		FireResult
	} from '$game/battleShip2'
	import {
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
		isFleetDestroyed
	} from '$game/battleShip2'
	import Log from '../lib/components/Log.svelte'
	const logText = async (message = '', type = 'info', timeout = 6000) => {
		logger.add({
			message,
			type,
			dismissible: true,
			timeout
		})
	}

	const sounds = {
		error: new Howl({
			src: ['/sound/error1.ogg'],
			onend: function () {
				soundLock = false
			}
		}),
		explosion: new Howl({
			src: ['/sound/explosion1.ogg'],
			onend: function () {
				soundLock = false
			}
		}),
		gameover: new Howl({
			src: ['/sound/gameover1.ogg'],
			onend: function () {
				soundLock = false
			}
		}),
		hit: new Howl({
			src: ['/sound/hit2.ogg'],
			onend: function () {
				soundLock = false
			}
		}),
		hurt: new Howl({
			src: ['/sound/hurt1.ogg'],
			onend: function () {
				soundLock = false
			}
		}),
		lose: new Howl({
			src: ['/sound/error2.ogg'],
			onend: function () {
				soundLock = false
			}
		}),
		upgrade: new Howl({
			src: ['/sound/upgrade1.ogg'],
			onend: function () {
				soundLock = false
			}
		})
	}
	let soundLock = $state(false)
	Howler.volume(0.1)
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

	// Nächstes noch nicht platziertes Schiff (wird nach jeder Platzierung automatisch ausgewählt)
	let nextUnplacedId: ShipId | null = $derived(
		fleetEntries.find((e) => !e.placed)?.id ?? null
	)

	// Preview-Zellen für das aktuell gehoverte Feld, inkl. Gültigkeitsprüfung.
	// Reagiert automatisch auf Änderungen an hoveredCell, selectedShipId, orientation, board.
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
		logText('Die Schlacht beginnt. Plazieren sie ihre Schüsse.')
		gameState.phase = 'play'
	}

	/* ============================================================
	   GEFECHTSPHASE
	   ============================================================ */

	const handleHitEnemy = async (result: FireResult) => {
		if (result.shipSunk) {
			sounds.explosion.play()
			logText(`Der feindliche ${result.shipId} wurde zerstört`, 'success')
		} else {
			sounds.hit.play()
			logText(`Der feindliche ${result.shipId} wurde getroffen`, 'info', 3000)
		}
	}

	const handleHitHero = async (result: FireResult) => {
		if (result.shipSunk) {
			sounds.explosion.play()
			logText(`Dein ${result.shipId} wurde zerstört`, 'error', 3000)
		} else {
			sounds.hit.play()
			logText(`Dein ${result.shipId} wurde getroffen`, 'warning', 3000)
		}
	}

	function handlePlayerShot(x: number, y: number) {
		selectedEnemyId = ''
		if (gameState.phase !== 'play' || gameState.turn !== 'human') return

		const result = fireAt(enemyBoard, enemyShips, x, y)
		if (result.alreadyFired) return // Feld schon beschossen, ignorieren

		if (isFleetDestroyed(enemyShips)) {
			gameState.winner = 'human'
			gameState.phase = 'result'
			sounds.gameover.play()
			return
		}

		if (result.hit && result.shipId) {
			handleHitEnemy(result)
		}
		// Bei Treffer darf man (klassische Regel) nochmal schießen, sonst Zugwechsel
		if (!result.hit) {
			sounds.error.play()

			gameState.turn = 'enemy'
			setTimeout(enemyTurn, 1400) // kleine Verzögerung, wirkt weniger abrupt
		}
	}

	// Einfache KI: schießt zufällig auf noch nicht beschossene Felder.
	// Trifft sie, darf sie (wie der Spieler) nochmal schießen.
	function enemyTurn() {
		if (gameState.phase !== 'play') return

		let x: number, y: number
		do {
			x = Math.floor(Math.random() * SIZE)
			y = Math.floor(Math.random() * SIZE)
		} while (heroBoard[y][x].hit)

		const result = fireAt(heroBoard, heroShips, x, y)

		if (isFleetDestroyed(heroShips)) {
			gameState.winner = 'enemy'
			gameState.phase = 'result'
			return
		}

		if (result.hit) {
			handleHitHero(result)
			sounds.hit.play()
			setTimeout(enemyTurn, 900)
		} else {
			sounds.lose.play()
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
		selectedEnemyId = null
		hoveredCell = null
		setupEnemy()
		logText('Game is ready to play!')
		logText('Platziere deine Flotte', 'warning')
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
		<!--	{@render card1('Flotte', fleetEntries, true)}
		{@render card2()}
		{@render card1('Enemy', enemyEntries, false)}
		<div>
			<div class="split">
				<span>enemyLosts</span>
				<span>{enemyLosts}</span>
			</div>
			<div class="split">
				<span>selectedShipId</span>
				<span>{selectedShipId}</span>
			</div>
			<div class="split">
				<span>selexctedEnemyId</span>
				<span>{selectedEnemyId}</span>
			</div>
		</div> -->
	</aside>
</main>

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

{#snippet bars()}
	<div class="bar-h">
		{#each Array.from({ length: SIZE }, (_, i) => i) as item, x (x)}
			<span class="bg-base-300 font-semibold">
				{String.fromCharCode(65 + x)}
			</span>
		{/each}
	</div>
	<div class="bar-v">
		{#each Array.from({ length: SIZE }, (_, i) => i) as item, y (y)}
			<span class="bg-base-300 font-semibold">
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
