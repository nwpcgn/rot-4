<script lang="ts">
	import Hero from './Hero.svelte'

	import { generateDungeon } from './generateDungeon'
	import { isAlive, takeDamage, distanceTo } from '$game/actor'
	import { isDebugging } from './options'
	import { onMount } from 'svelte'
	import { randomItem, useItem as applyItem, type Item } from '$game/items'
	import { sleep } from '$lib'
	import { spawnEnemies, allEnemiesTurn, type Enemy } from '$game/enemies'
	import { TILE, TILE_DEFS, type TileId } from '$game/tiles'
	import * as ROT from 'rot-js'
	import GameOver from '$game/GameOver.svelte'
	import Inventory from '$game/Inventory.svelte'
	import Logger from './Logger.svelte'
	import opionsMap from './optionMapBase'
	import Preview from './Preview.svelte'
	import type { Player } from '$game/types'
	let gamePage = $state({ w: 0, h: 0 })
	let {
		options = {
			VIEW_WIDTH: 20,
			VIEW_HEIGHT: 12,
			MAP_WIDTH: 60,
			MAP_HEIGHT: 40,
			TILE_SIZE: 32
		}
	} = $props()

	let op = $state({
		...opionsMap,
		width: options.MAP_WIDTH,
		height: options.MAP_HEIGHT
	})

	const createGrid = <T,>(fill: T) =>
		Array.from({ length: options.MAP_HEIGHT }, () =>
			Array(options.MAP_WIDTH).fill(fill)
		)

	let roomList = $state([])
	let keyLock = $state(false)
	let stairs = $state({ x: 0, y: 0 })
	// ─── State ─────────────────────────────────────────────────
	let gameOver = $derived(!isAlive(player))
	let player = $state<Player>({
		id: 1,
		name: 'Held',
		char: '@',
		color: 'yellow',
		pos: { x: 0, y: 0 },
		stats: { hp: 99, maxHp: 99, atk: 5, def: 2 },
		inventory: []
	})

	let enemies = $state<Enemy[]>([])
	let map = $state(createGrid<TileId>(TILE.WALL))
	let items = $state(createGrid<Item | null>(null))
	let explored = createGrid(false)
	let visible = createGrid(false)
	let log = $state<string[]>(['Willkommen im Dungeon!'])
	let mounted = $state(false)

	let display: ROT.Display

	function addLog(msg: string) {
		log = [msg, ...log].slice(0, 20)
	}

	let itemsOnMap = $derived(
		items.flat().reduce((accumulator, currentValue) => {
			if (currentValue) {
				accumulator = accumulator + 1
			}
			return accumulator
		}, 0)
	)

	// ─── Map generieren ────────────────────────────────────────
	function generateMap() {
		player.inventory.push(randomItem())
		player.inventory.push(randomItem())
		player.inventory.push(randomItem())
		const { tiles, rooms, start, exit } = generateDungeon(op)
		map = tiles
		roomList = rooms
		player.pos = start
		stairs = exit
		map[exit.y][exit.x] = TILE.STAIRS

		rooms.forEach((room, id) => {
			if (id === 0) {
				return
			}
			if (Math.random() < 0.5) {
				const ix = ROT.RNG.getUniformInt(room.x, room.x + room.width - 1)
				const iy = ROT.RNG.getUniformInt(room.y, room.y + room.height - 1)
				if (!items[iy][ix]) items[iy][ix] = randomItem()
			}
		})
		enemies = spawnEnemies(rooms, map)
		addLog(
			`Items: ${itemsOnMap} | Enemies: ${enemies.length} | Rooms: ${roomList.length}`
		)
	}

	// ─── FOV ───────────────────────────────────────────────────
	function updateFOV() {
		const fov = new ROT.FOV.PreciseShadowcasting((x, y) => {
			if (x < 0 || x >= options.MAP_WIDTH || y < 0 || y >= options.MAP_HEIGHT)
				return false
			return TILE_DEFS[map[y][x]]?.lightPass ?? false
		})
		for (let y = 0; y < options.MAP_HEIGHT; y++) visible[y].fill(false)
		fov.compute(player.pos.x, player.pos.y, 10, (x, y) => {
			if (x >= 0 && x < options.MAP_WIDTH && y >= 0 && y < options.MAP_HEIGHT) {
				visible[y][x] = true
				explored[y][x] = true
			}
		})
	}

	// ─── Rendering ─────────────────────────────────────────────
	function draw() {
		display.clear()
		const ox = Math.max(
			0,
			Math.min(
				player.pos.x - Math.floor(options.VIEW_WIDTH / 2),
				options.MAP_WIDTH - options.VIEW_WIDTH
			)
		)
		const oy = Math.max(
			0,
			Math.min(
				player.pos.y - Math.floor(options.VIEW_HEIGHT / 2),
				options.MAP_HEIGHT - options.VIEW_HEIGHT
			)
		)

		for (let y = 0; y < options.VIEW_HEIGHT; y++) {
			for (let x = 0; x < options.VIEW_WIDTH; x++) {
				const mx = x + ox,
					my = y + oy
				if (!visible[my][mx] && !explored[my][mx]) continue

				const isVis = visible[my][mx]
				let { style, char } = TILE_DEFS[map[my][mx]]
				let fg = isVis ? style.fg : '#333'

				const item = items[my][mx]
				if (item && isVis) {
					char = item.char
					fg = item.color
				}

				display.draw(x, y, char, fg)
			}
		}

		// Enemies zeichnen (nur wenn sichtbar)
		for (const enemy of enemies) {
			if (!isAlive(enemy)) continue
			if (!visible[enemy.pos.y]?.[enemy.pos.x]) continue
			display.draw(enemy.pos.x - ox, enemy.pos.y - oy, enemy.char, enemy.color)
		}

		// Spieler immer oben drauf
		display.draw(player.pos.x - ox, player.pos.y - oy, '@', 'yellow', 'blue')
	}

	$effect(() => {
		if (!mounted) return

		updateFOV(player.pos)
		draw(player.pos)
	})

	// ─── Input & Spielzug ──────────────────────────────────────
	let lastMove = 0
	const moveInterval = 100

	function handleInput(e: KeyboardEvent) {
		if (!isAlive(player)) return
		if (keyLock) return

		const now = Date.now()
		if (now - lastMove < moveInterval) {
			return
		}

		lastMove = now
		// if (event.repeat) {
		// 	// return
		// }

		const MOVES: Record<string, [number, number]> = {
			ArrowUp: [0, -1],
			ArrowDown: [0, 1],
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0]
		}

		if (MOVES[e.key]) {
			const [dx, dy] = MOVES[e.key]
			const nx = player.pos.x + dx
			const ny = player.pos.y + dy
			const target = map[ny]?.[nx]
			if (target === undefined) return

			// Enemy auf dem Ziel-Tile? → Angriff
			const enemyOnTile = enemies.find(
				(en) => isAlive(en) && en.pos.x === nx && en.pos.y === ny
			)

			if (enemyOnTile && isDebugging) {
				console.log('VOR Angriff:', JSON.stringify(enemyOnTile.stats))
				const dmg = takeDamage(enemyOnTile, player.stats.atk)
				console.log(
					'NACH Angriff:',
					JSON.stringify(enemyOnTile.stats),
					'dmg:',
					dmg
				)
				console.log('isAlive:', isAlive(enemyOnTile))
			}

			if (enemyOnTile) {
				const dmg = takeDamage(enemyOnTile, player.stats.atk)
				addLog(`Du triffst ${enemyOnTile.name} für ${dmg} Schaden.`)
				if (!isAlive(enemyOnTile)) {
					addLog(`${enemyOnTile.name} wurde besiegt! (+${enemyOnTile.xp} XP)`)
				}
			} else if (TILE_DEFS[target].walkable) {
				player.pos.x = nx
				player.pos.y = ny
				if (target === TILE.STAIRS) {
					handleStairs()
				}
			} else if (target === TILE.DOOR_CLOSED) {
				map[ny][nx] = TILE.DOOR_OPEN
				addLog('Tür geöffnet.')
			}

			// Item aufheben
			const item = items[player.pos.y][player.pos.x]
			if (item) {
				player.inventory.push(item)
				items[player.pos.y][player.pos.x] = null
				addLog(`${item.char} ${item.name} aufgehoben.`)
			}

			// Enemies sind dran
			// allEnemiesTurn(enemies, player, map, addLog)
			enemies = allEnemiesTurn(enemies, player, map, addLog).filter(isAlive)
			// Tote Enemies entfernen
			enemies = enemies.filter(isAlive)
		} else if (e.key === 'g') {
			// Manuelles Aufheben mit 'g'
			const item = items[player.pos.y][player.pos.x]
			if (item) {
				player.inventory.push(item)
				items[player.pos.y][player.pos.x] = null
				addLog(`${item.name} aufgehoben.`)
			}
		}

		// updateFOV()
		// draw()
	}

	async function handleStairs() {
		keyLock = true
		mounted = false
		display.clear()
		resetMap()
		generateMap()
		mounted = true
		keyLock = false
	}

	// ─── Inventory-Callbacks ───────────────────────────────────
	function onUseItem(item: Item) {
		const msg = applyItem(item, player)
		const idx = player.inventory.indexOf(item)
		if (idx !== -1) player.inventory.splice(idx, 1)
		addLog(msg)
	}

	function onDropItem(item: Item) {
		items[player.pos.y][player.pos.x] = item
		const idx = player.inventory.indexOf(item)
		if (idx !== -1) player.inventory.splice(idx, 1)
		addLog(`${item.name} weggeworfen.`)
	}

	/* ------------------------------- Reset Game ------------------------------- */

	function resetPlayer() {
		// Stats zurücksetzen
		player.stats.hp = player.stats.maxHp
		player.pos.x = 0
		player.pos.y = 0
		player.inventory = []
	}
	function resetMap() {
		// Grids neu erstellen
		map = createGrid<TileId>(TILE.WALL)
		items = createGrid<Item | null>(null)
		explored = createGrid(false)
		visible = createGrid(false)
		enemies = []
		log = ['Neues Spiel gestartet.']
	}

	const resetGame = async () => {
		display = new ROT.Display({
			width: options.VIEW_WIDTH,
			height: options.VIEW_HEIGHT,
			fontSize: options.TILE_SIZE,
			forceSquareRatio: true
		})
		document
			.getElementById('game-container')
			?.appendChild(display.getContainer()!)
		resetPlayer()
		resetMap()
		generateMap()
		mounted = true

		// updateFOV()
		// draw()

		window.addEventListener('keydown', handleInput)
		return () => window.removeEventListener('keydown', handleInput)
	}

	// ─── Mount ─────────────────────────────────────────────────
	onMount(() => {
		resetGame()

		window.addEventListener('keydown', handleInput)
		return () => window.removeEventListener('keydown', handleInput)
	})
	// $inspect(player.stats.hp)
</script>

<!-- HP-Anzeige über dem Spielfeld -->

<section class="page page-fixed nwp">
	<div class="grid flex-1 place-content-center">
		<div style="position: relative">
			<div>
				<div class="split">
					<div>
						<em>Map:</em> <b>{options.MAP_WIDTH}x{options.MAP_HEIGHT}</b>
					</div>

					<div>
						<em>Rooms:</em> <b>{roomList.length}</b>
						<em>Enemies:</em> <b>{enemies.length}</b>
						<em>Items</em> <b>{itemsOnMap}</b>
					</div>
				</div>
			</div>

			<div id="game-container"></div>

			{#if gameOver}
				<GameOver onReset={resetGame} />
			{/if}
		</div>
	</div>
	<Logger {log}></Logger>
</section>

<aside class="aside space-y-2 bg-base-300 p-2">
	<Preview {map} {player} {enemies} {explored}></Preview>
	<Hero {player}></Hero>
	<Inventory
		inventory={player.inventory}
		onUse={onUseItem}
		onDrop={onDropItem} />
</aside>
