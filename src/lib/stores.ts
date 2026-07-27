// stores.js
import { writable } from 'svelte/store'

export const SIZE = 10

function createBoard() {
	// Jede Zelle: { ship: null | shipId, hit: false }
	const cells = Array(SIZE * SIZE)
		.fill(null)
		.map(() => ({ ship: null, hit: false }))
	return writable(cells)
}

function getShipCells(startX, startY, length, orientation) {
	const cells = []
	for (let i = 0; i < length; i++) {
		const x = orientation === 'horizontal' ? startX + i : startX
		const y = orientation === 'vertical' ? startY + i : startY
		cells.push({ x, y })
	}
	return cells
}

function isValidPlacement(cells, boardState, size = 10) {
	return cells.every(({ x, y }) => {
		// innerhalb des Grids?
		if (x < 0 || x >= size || y < 0 || y >= size) return false
		// Zelle schon belegt?
		const idx = y * size + x
		if (boardState[idx].ship !== null) return false
		return true
	})
}

function placeShip(startX, startY, length, orientation, shipId) {
	board.update((cells) => {
		const shipCells = getShipCells(startX, startY, length, orientation)
		if (!isValidPlacement(shipCells, cells)) {
			return cells // ungültig, nichts ändern
		}
		shipCells.forEach(({ x, y }) => {
			cells[y * 10 + x].ship = shipId
		})
		return cells
	})
}

export const board = createBoard()
export const ships = writable([]) // { id, cells: [{x,y}], sunk: false }
