<script lang="ts">
	let { map, explored, player } = $props()
	let maxW = $state(0)
	let ts = $state(1)
	let canvas: HTMLCanvasElement = $state()
	let ctx

	const draw = async () => {
		if (!ctx) {
			console.log('no ctx')
			return
		}

		const w = map[0].length
		const h = map.length
		ts = Math.floor(maxW / w)
		canvas.width = ts * w
		canvas.height = ts * h

		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const stepTile = map[y][x]
				if (stepTile == 1) continue

				ctx.fillStyle = '#222'
				if (explored[y][x]) {
					ctx.fillStyle = '#ccc'
				}

				if (stepTile == 2) {
					ctx.fillStyle = 'oklch(71.5% 0.143 215.221)'
				} else if (stepTile == 4) {
					ctx.fillStyle = 'oklch(60.6% 0.25 292.717)'
				}
				ctx.fillRect(x * ts, y * ts, ts, ts)
			}
		}

		ctx.fillStyle = 'oklch(65.6% 0.241 354.308)'
		ctx.fillRect(player.pos.x * ts, player.pos.y * ts, ts, ts)
	}

	$effect(() => {
		ctx = canvas.getContext('2d')
		draw(map)
	})
</script>

<div class="flex justify-center bg-neutral p-1" bind:clientWidth={maxW}>
	<canvas class="bg-neutral" bind:this={canvas}></canvas>
</div>
