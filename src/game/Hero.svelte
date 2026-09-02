<script lang="ts">
	import Progress from './Progress.svelte'

	let {
		player = {
			id: 1,
			name: 'Held',
			char: '@',
			color: 'yellow',
			pos: { x: 0, y: 0 },
			stats: { hp: 100, maxHp: 100, atk: 5, def: 2 },
			inventory: []
		}
	} = $props()
</script>

<div class="grid bg-base-200">
	<header class="split bg-secondary px-2 py-2 text-secondary-content">
		<span class="flex-1"><b>Hero</b></span>
		<span
			><em>HP:</em> <strong>{player?.stats.hp}</strong> /<small
				>{player?.stats.maxHp}</small
			></span>
	</header>
	<Progress min={0} max={player?.stats.maxHp} value={player?.stats.hp}
	></Progress>
	<div class="grid grid-cols-2 divide-x">
		<div class="split px-2 py-1">
			<span class="capitalize italic">Atk</span>
			<span class="font-semibold">{player?.stats.atk}</span>
		</div>

		<div class="split px-2 py-1">
			<span class="capitalize italic">Def</span>
			<span class="font-semibold">{player?.stats.def}</span>
		</div>
	</div>
	<hr />
</div>
