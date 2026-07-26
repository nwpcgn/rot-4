<script lang="ts">
	// import logger from '$lib/components/logger.svelte.ts'
	const items = [1, 2, 3, 4, 5]
	let { log } = $props()
</script>



<div class="stacker bg-base-200 px-4">
	<div class="log opacity-0">
		{#each items as item (item)}
			<div>{item}</div>
		{/each}
	</div>
	<div class="log active">
		{#each log.slice(0, items.length) as entry, i}
			<div style="opacity: {1 - i * 0.18}">{entry}</div>
		{/each}
	</div>
</div>
