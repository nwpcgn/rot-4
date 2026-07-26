import alertsList from '$lib/utils/alerts.json'
const shuffle = (array) => {
	let currentIndex = array.length
	let temporaryValue, randomIndex
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex)
		currentIndex -= 1
		temporaryValue = array[currentIndex]
		array[currentIndex] = array[randomIndex]
		array[randomIndex] = temporaryValue
	}

	return array
}

export interface Note {
	id?: string
	type: string
	message: string
	dismissible: boolean
	timeout: number
}
export const alerts: Note[] = alertsList

export interface Alert {
	id?: string
	type: string
	message: string
	dismissible: boolean
	timeout: number
}

export class MsgLogger {
	buffer: Note[] = $state([])
	list: Note[] = $state([])
	timeId: number = $state(0)
	#busy: boolean = $state(false)
	#speed: number = $state(2)
	get speed() {
		return this.#speed
	}
	set speed(value: number) {
		this.#speed = value
	}
	get busy() {
		return this.#busy
	}
	set busy(value) {
		this.#busy = value
	}
	getId(length = 6) {
		return Math.random()
			.toString(36)
			.substring(2, length + 2)
	}
	add(message: Note) {
		const id = this.getId()
		const defaults = {
			id,
			type: 'info',
			dismissible: true,
			timeout: 20000
		}
		const mObj = { ...defaults, ...message }
		this.buffer.push(mObj)
		if (this.buffer.length === 1) {
			this.showNextMessage()
		}
	}

	async showNextMessage() {
		if (this.#busy) return
		if (!this.buffer.length || this.list.length >= 3) {
			clearTimeout(this.timeId)
			this.#busy = false
			return
		}

		this.#busy = true

		const msg = this.buffer.shift()
		const text = msg?.message
		const duration = text.length / (this.#speed * 0.01)

		const newList = [msg, ...this.list]
		this.list = newList
		this.timeId = setTimeout(() => {
			if (msg.timeout) setTimeout(() => this.remove(msg.id), msg.timeout)
			this.#busy = false
			this.showNextMessage()
		}, duration)
	}

	demo(count = 1) {
		const data = shuffle(alerts).slice(0, count)
		data.map((log) => {
			this.add({ ...log, timeout: 0 })
		})
	}

	async shift() {
		if (this.list.length) {
			const msg = this.list.pop()
			this.showNextMessage()
			return {
				message: 'Log removed',
				body: { ...msg }
			}
		}
	}

	remove(id: string) {
		this.list = this.list.filter((t) => t.id !== id)
		this.showNextMessage()
	}

	empty() {
		if (this.#busy) return
		if (!this.list.length) {
			clearTimeout(this.timeId)
			this.#busy = false
			return
		}

		this.#busy = true
		this.list.shift()
		this.timeId = setTimeout(() => {
			this.#busy = false
			this.empty()
		}, 400)
	}

	clear() {
		clearTimeout(this.timeId)
		this.buffer = []
		this.list = []
		this.#busy = false
	}
}

export const logger = new MsgLogger()
export default logger
