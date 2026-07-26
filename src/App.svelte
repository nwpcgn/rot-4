<script lang="ts">
	import * as ROT from 'rot-js'

	import Game from './game/Game.svelte'
	import { Sprites, Log } from '$lib'
	import { logger } from '$lib/components/logger.svelte.ts'
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
</script>

<div id="portals"></div>

<Game></Game>

<Sprites />
