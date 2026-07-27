<script lang="ts">
	import Grid1 from './Grid1.svelte'
	import * as ROT from 'rot-js'
	import { board, ships, SIZE } from './lib/stores'
	import Game from './game/Game.svelte'
	import { Sprites, Log } from '$lib'
	import { logger } from '$lib/components/logger.svelte.ts'
	import { onMount } from 'svelte'
	const op = {
		width: 60,
		height: 40,
		algorithm: 'digger',
		roomWidth: [3, 9] /* room minimum and maximum width */,
		roomHeight: [3, 5] /* room minimum and maximum height */,
		corridorLength: [3, 10] /* corridor minimum and maximum length */,
		dugPercentage: 0.2 /* we stop after this percentage of level area has been dug out */,
		roomDugPercentage: 0.1 /* we stop after this much time has passed (msec) */
	}

	const createGrid = <T,>(fill: T) =>
		Array.from({ length: SIZE }, () => Array(SIZE).fill(fill))

	const SHIP_DEFS = [
		{ id: 'carrier', name: 'Carrier', length: 5 },
		{ id: 'battleship', name: 'Battleship', length: 4 },
		{ id: 'cruiser', name: 'Cruiser', length: 3 },
		{ id: 'submarine', name: 'Submarine', length: 3 },
		{ id: 'destroyer', name: 'Destroyer', length: 2 }
	]

	let orientation = $state('horizontal') // 'horizontal' | 'vertical'
	let selectedShipId = $state(SHIP_DEFS[0].id)
	let placedShips = $state({}) // shipId -> cells[]

	let cellEls = $state([])
	// ---- Core placement logic (identisch zur Svelte-Version) ----
	function getShipCells(startX, startY, length, orient) {
		const cells = []
		for (let i = 0; i < length; i++) {
			const x = orient === 'horizontal' ? startX + i : startX
			const y = orient === 'vertical' ? startY + i : startY
			cells.push({ x, y })
		}
		return cells
	}

	function isValidPlacement(cells) {
		return cells.every(({ x, y }) => {
			if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return false
			const idx = y * SIZE + x
			return $board[idx].ship === null
		})
	}
	function placeShip(startX, startY, shipDef) {
		const cells = getShipCells(startX, startY, shipDef.length, orientation)
		if (!isValidPlacement(cells)) return false
		cells.forEach(({ x, y }) => {
			$board[y * SIZE + x].ship = shipDef.id
			cellEls[y * SIZE + x].ship = true
		})
		placedShips[shipDef.id] = cells

		return true
	}
	function resetBoard() {
		$board = Array.from({ length: SIZE * SIZE }, () => ({ ship: null }))
		cellEls = Array.from({ length: SIZE * SIZE }, (_, i) => {
			const x = i % SIZE
			const y = Math.floor(i / SIZE)
			return {
				index: i,
				x,
				y,
				pre: false,
				valid: true
			}
		})
		placedShips = {}
		selectedShipId = SHIP_DEFS.find((s) => !placedShips[s.id])?.id ?? null
		setStatus('Fleet zurückgesetzt.', '')
	}
	function setStatus(msg, kind) {
		const o = {
			type: kind,
			message: msg,
			dismissible: true,
			timeout: 4000
		}
		console.log('setStatus', o)
		logger.add(o)
	}

	function showPreview(x, y) {
		clearPreview()
		const shipDef = SHIP_DEFS.find((s) => s.id === selectedShipId)
		if (!shipDef) return

		const cells = getShipCells(x, y, shipDef.length, orientation)
		const valide = isValidPlacement(cells)
		cells.forEach(({ x: cx, y: cy }) => {
			if (cx < 0 || cx >= SIZE || cy < 0 || cy >= SIZE) return
			const el = cy * SIZE + cx

			cellEls[el].pre = true
			cellEls[el].valid = valide
		})
	}
	function clearPreview() {
		cellEls.forEach((el, i) => {
			cellEls[i] = { ...el, pre: false, valid: true }
		})
	}
	function attemptPlace(x, y) {
		const shipDef = SHIP_DEFS.find((s) => s.id === selectedShipId)
		if (!shipDef) {
			setStatus('Alle Schiffe sind bereits platziert.', 'info')
			return
		}
		const ok = placeShip(x, y, shipDef)
		if (!ok) {
			setStatus(`Ungültige Position für ${shipDef.name}.`, 'error')
			return
		}
		setStatus(`${shipDef.name} platziert.`, 'info')
		placedShips[shipDef.id] = shipDef

		const next = SHIP_DEFS.find((s) => !placedShips[s.id])
		selectedShipId = next ? next.id : null
		clearPreview()
	}

	const resetter = () => {
		console.log('resetter')
		resetBoard()
	}

	const init = async () => {
		console.log('init')
		cellEls.Array.from({ length: SIZE * SIZE }, (_, i) => {
			const x = i % SIZE
			const y = Math.floor(i / SIZE)
			return {
				index: i,
				x,
				y,
				pre: false,
				valid: true
			}
		})
	}

	$inspect(Object.keys(placedShips).length)
</script>

<section class="page nwp center">
	<div class="text-center">
		<div class="header">
			<h5>Battleship // Deployment</h5>
			<div class="sub">PHASE: PLACEMENT</div>
		</div>
		<div>
			<Grid1 {cellEls} {showPreview} {clearPreview} {attemptPlace}></Grid1>
			<div class="split pt-4">
				<div class="join">
					<span class="btn join-item btn-secondary">Orientation</span>
					<button
						class="btn join-item"
						onclick={() => {
							orientation =
								orientation === 'horizontal' ? 'vertical' : 'horizontal'
						}}
						>{orientation === 'horizontal'
							? '⤾ Horizont'
							: '⤿ Vertikal'}</button>
				</div>

				<button class="btn btn-error" onclick={resetBoard}>Reset</button>
			</div>
		</div>
	</div>
</section>

<aside class="aside">
	<nav class="grid p-2">
		{#each SHIP_DEFS as { name, id, length } (id)}
			<button
				class="split cursor-pointer py-1 transition-all duration-200 ease-in"
				class:text-info={selectedShipId === id}
				onclick={() => (selectedShipId = id)}>
				<span class="text-xl font-bold">{name}</span>
				<span class="nav">
					{#each Array.from({ length: length }, (_, i) => i) as item (item)}
						<div
							aria-label="status"
							class="status status-xl transition-all duration-200 ease-in"
							class:status-info={selectedShipId === id}>
						</div>
					{/each}
				</span>
			</button>
		{/each}
	</nav>
</aside>
