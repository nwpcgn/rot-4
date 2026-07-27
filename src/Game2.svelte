<script lang="ts">
	import { onMount } from 'svelte'

	const SIZE = 10
	const SHIP_DEFS = [
		{ id: 'carrier', name: 'Carrier', length: 5 },
		{ id: 'battleship', name: 'Battleship', length: 4 },
		{ id: 'cruiser', name: 'Cruiser', length: 3 },
		{ id: 'submarine', name: 'Submarine', length: 3 },
		{ id: 'destroyer', name: 'Destroyer', length: 2 }
	]

	// ---- State (in Svelte: writable stores) ----
	let board = Array.from({ length: SIZE * SIZE }, () => ({ ship: null }))
	let orientation = 'horizontal' // 'horizontal' | 'vertical'
	let selectedShipId = SHIP_DEFS[0].id
	let placedShips = {} // shipId -> cells[]

	// ---- DOM refs ----
	let isPreview = $state(false)
	let gridEl = $state('grid')
	let fleetListEl = $state('fleetList')

	let statusEl = $state('statusMsg')
	let coordsRow = $state([])
	let coordsCol = $state([])

	let phase = $state('PLACEMENT')
	let cellEls = $state([])
	onMount(() => {
		// ---- Build coordinate labels ----
		for (let x = 0; x < SIZE; x++) {
			// const s = document.createElement('span')
			// s.textContent = String.fromCharCode(65 + x)
			coordsRow.push(String.fromCharCode(65 + x))
		}
		for (let y = 0; y < SIZE; y++) {
			// const s = document.createElement('span')
			// s.textContent = y + 1
			coordsCol.push(y + 1)
		}

		// ---- Build grid cells ----

		for (let i = 0; i < SIZE * SIZE; i++) {
			const cell = {
				className: 'cell',
				index: i,
				x: i % SIZE,
				y: Math.floor(i / SIZE)
			}

			cellEls.push(cell)

			// cell.addEventListener('mouseenter', () => showPreview(x, y))
			// cell.addEventListener('mouseleave', clearPreview)
			// cell.addEventListener('click', () => attemptPlace(x, y))
		}
	})

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
			return board[idx].ship === null
		})
	}

	function placeShip(startX, startY, shipDef) {
		const cells = getShipCells(startX, startY, shipDef.length, orientation)
		if (!isValidPlacement(cells)) return false
		cells.forEach(({ x, y }) => {
			board[y * SIZE + x].ship = shipDef.id
		})
		placedShips[shipDef.id] = cells
		return true
	}

	function resetBoard() {
		board = Array.from({ length: SIZE * SIZE }, () => ({ ship: null }))
		placedShips = {}
		selectedShipId = SHIP_DEFS.find((s) => !placedShips[s.id])?.id ?? null
		render()
		setStatus('Fleet zurückgesetzt.', '')
	}

	// ---- Preview on hover ----
	function showPreview(x, y) {
		clearPreview()
		const shipDef = SHIP_DEFS.find((s) => s.id === selectedShipId)
		if (!shipDef) return
		const cells = getShipCells(x, y, shipDef.length, orientation)
		const valid = isValidPlacement(cells)
		cells.forEach(({ x: cx, y: cy }) => {
			if (cx < 0 || cx >= SIZE || cy < 0 || cy >= SIZE) return
			const el = cellEls[cy * SIZE + cx]
			el.valid = valid ? 'preview-ok' : 'preview-bad'
		})
	}

	function clearPreview() {
		// cellEls.forEach((el) => el.classList.remove('preview-ok', 'preview-bad'))
		isPreview = false
	}

	// ---- Click to place ----
	function attemptPlace(x, y) {
		const shipDef = SHIP_DEFS.find((s) => s.id === selectedShipId)
		if (!shipDef) {
			setStatus('Alle Schiffe sind bereits platziert.', 'ok')
			return
		}
		const ok = placeShip(x, y, shipDef)
		if (!ok) {
			setStatus(`Ungültige Position für ${shipDef.name}.`, 'error')
			return
		}
		setStatus(`${shipDef.name} platziert.`, 'ok')
		const next = SHIP_DEFS.find((s) => !placedShips[s.id])
		selectedShipId = next ? next.id : null
		clearPreview()
		render()
	}

	// ---- Rotate ----
	// rotateBtn.addEventListener('click', () => {
	// 	orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal'
	// 	rotateBtn.textContent =
	// 		orientation === 'horizontal' ? '⤾ Horizontal' : '⤿ Vertikal'
	// })

	// resetBtn.addEventListener('click', resetBoard)

	function setStatus(msg, kind) {
		statusEl.textContent = msg
		statusEl.className = 'status' + (kind ? ' ' + kind : '')
	}

	// ---- Fleet list ----
	function renderFleet() {
		fleetListEl.innerHTML = ''
		SHIP_DEFS.forEach((s) => {
			const row = document.createElement('div')
			const placed = !!placedShips[s.id]
			row.className =
				'fleet-item' +
				(placed ? ' placed' : s.id === selectedShipId ? ' active' : '')
			row.innerHTML = `<span>${s.name}</span><span class="len">${'▮'.repeat(s.length)}</span>`
			if (!placed) {
				row.addEventListener('click', () => {
					selectedShipId = s.id
					renderFleet()
					setStatus(`${s.name} ausgewählt.`, '')
				})
			}
			fleetListEl.appendChild(row)
		})

		if (SHIP_DEFS.every((s) => placedShips[s.id])) {
			phase = 'READY'
			setStatus('Alle Schiffe platziert — bereit zum Gefecht.', 'ok')
		} else {
			phase = 'PLACEMENT'
		}
	}

	// ---- Board render ----
	function renderBoard() {
		cellEls.forEach((el, i) => {
			el.classList.toggle('ship', board[i].ship !== null)
		})
	}

	function render() {
		// renderBoard()
		// renderFleet()
	}

	render()
</script>

<main class="main">
	<section class="page nwp">
		<div class="console">
			<div class="header">
				<h1>Battleship // Deployment</h1>
				<div class="sub" id="phaseLabel">PHASE: {phase}</div>
			</div>

			<div class="layout">
				<div class="board-wrap">
					<div class="coords-row" id="coordsRow">
						{#each coordsRow as item}
							<div>{item}</div>
						{/each}
					</div>
					<div class="board-body">
						<div class="coords-col" id="coordsCol">
							{#each coordsCol as item}
								<div>{item}</div>
							{/each}
						</div>
						<div class="grid--j" id="grid" bind:this={gridEl}>
							{#each cellEls as { index, x, y } (index)}
								<span
									class="cell"
									onclick={() => attemptPlace(x, y)}
									onmouseenter={() => showPreview(x, y)}
									onmouseleave={() => clearPreview(x.y)}
									data-index={index}></span>
							{/each}
						</div>
					</div>
				</div>
				<!-- 		// cell.addEventListener('mouseleave', clearPreview) // cell.addEventListener('click',
				() => attemptPlace(x, y)) -->
				<div class="side-panel">
					<div class="fleet-list">
						<h2>Fleet</h2>
						<div id="fleetList" bimd:this={fleetListEl}></div>
					</div>

					<div class="controls">
						<div class="row">
							<span>Orientation</span>
							<button
								id="rotateBtn"
								onclick={() => {
									orientation =
										orientation === 'horizontal' ? 'vertical' : 'horizontal'
								}}>
								{orientation === 'horizontal' ? '⤾ Horizontal' : '⤿ Vertikal'}
							</button>
						</div>
						<div class="status" id="statusMsg" bind:this={statusEl}>
							Wähle ein Schiff, dann klicke ins Grid.
						</div>
						<button class="reset" id="resetBtn" onclick={resetBoard}
							>Reset Fleet</button>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>

<style>
	:root {
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
	* {
		box-sizing: border-box;
	}

	.console {
		width: 100%;
		max-width: 920px;
		background: var(--panel);
		border: 1px solid var(--grid-line);
		border-radius: 4px;
		padding: 20px 24px 24px;
		box-shadow:
			0 0 0 1px #000,
			0 20px 60px rgba(0, 0, 0, 0.5),
			inset 0 0 40px rgba(57, 255, 143, 0.03);
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		border-bottom: 1px dashed var(--grid-line);
		padding-bottom: 12px;
		margin-bottom: 18px;
	}
	.header h1 {
		font-size: 15px;
		letter-spacing: 3px;
		text-transform: uppercase;
		margin: 0;
		color: var(--sonar);
		font-weight: normal;
	}
	.header .sub {
		font-size: 11px;
		color: var(--text-dim);
		letter-spacing: 1px;
	}
	.layout {
		display: flex;
		gap: 28px;
		flex-wrap: wrap;
	}
	.board-wrap {
		flex: 0 0 auto;
	}
	.coords-row,
	.coords-col {
		display: grid;
		grid-template-columns: repeat(10, 32px);
		font-size: 10px;
		color: var(--text-dim);
	}
	.coords-row {
		margin-left: 22px;
		margin-bottom: 4px;
	}
	.coords-row span {
		text-align: center;
	}
	.board-body {
		display: flex;
	}
	.coords-col {
		grid-template-columns: none;
		grid-template-rows: repeat(10, 32px);
		width: 18px;
		margin-right: 4px;
	}
	.coords-col span {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.grid--j {
		display: grid;
		grid-template-columns: repeat(10, 32px);
		grid-template-rows: repeat(10, 32px);
		gap: 2px;
		background: var(--grid-line);
		border: 1px solid var(--grid-line);
	}
	.cell {
		background: var(--water);
		position: relative;
		cursor: pointer;
		transition: background 0.08s ease;
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
		background: rgba(57, 255, 143, 0.35);
	}
	.cell.preview-bad {
		background: rgba(255, 92, 92, 0.35);
	}

	.side-panel {
		flex: 1 1 260px;
		min-width: 240px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.fleet-list {
		border: 1px solid var(--grid-line);
		padding: 12px 14px;
		font-size: 12px;
	}
	.fleet-list h2 {
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--text-dim);
		margin: 0 0 10px;
		text-transform: uppercase;
		font-weight: normal;
	}
	.fleet-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 0;
		border-bottom: 1px solid var(--grid-line);
		cursor: pointer;
		opacity: 0.9;
	}
	.fleet-item:last-child {
		border-bottom: none;
	}
	.fleet-item.active {
		color: var(--sonar);
	}
	.fleet-item.placed {
		color: var(--text-dim);
		text-decoration: line-through;
		cursor: default;
	}
	.fleet-item .len {
		color: var(--text-dim);
		font-size: 11px;
	}
	.fleet-item.active .len {
		color: var(--sonar-dim);
	}

	.controls {
		border: 1px solid var(--grid-line);
		padding: 12px 14px;
		font-size: 12px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.controls .row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	button {
		background: transparent;
		border: 1px solid var(--sonar-dim);
		color: var(--sonar);
		font-family: inherit;
		font-size: 11px;
		letter-spacing: 1px;
		padding: 7px 12px;
		cursor: pointer;
		text-transform: uppercase;
	}
	button:hover {
		background: rgba(57, 255, 143, 0.1);
	}
	button:disabled {
		opacity: 0.3;
		cursor: default;
	}
	button:disabled:hover {
		background: transparent;
	}
	button.reset {
		border-color: var(--danger);
		color: var(--danger);
	}
	button.reset:hover {
		background: rgba(255, 92, 92, 0.1);
	}

	.status {
		font-size: 11px;
		color: var(--text-dim);
		min-height: 14px;
	}
	.status.error {
		color: var(--danger);
	}
	.status.ok {
		color: var(--sonar);
	}
</style>
