<script lang="ts">
	let options = $state({
		VIEW_WIDTH: 28,
		VIEW_HEIGHT: 16,
		MAP_WIDTH: 50,
		MAP_HEIGHT: 30,
		TILE_SIZE: 40,
		MAP_TYPE: 'Digger'
	})
	const TAB = {
		DUNGEON: 0,
		DISPLAY: 1
	}
	const TAB_SNIPPET = {
		[TAB.DUNGEON]: formDungeon,
		[TAB.DISPLAY]: dispInput
	}
	let active = $state(TAB.DUNGEON)
</script>

<header>
	<nav class="d-join">
		{#each Object.entries(TAB) as [tab, tabId] (tab)}
			<label class="d-join-item btn" class:btn-primary={tabId == active}>
				<span>{tab}</span>
				<input type="radio" bind:group={active} value={tabId} class="sr-only" />
			</label>
		{/each}
	</nav>
</header>

<section class="stacker">
	{#each Object.entries(TAB) as [tab, tabId] (tab)}
		<section
			class="w-xs rounded-box border border-base-300 bg-base-200 p-4"
			class:active={tabId == active}>
			{@render TAB_SNIPPET[tabId]?.()}
		</section>
	{/each}
</section>

{#snippet formDungeon()}
	<div class="contents">
		<div class="my-1 text-lg font-bold">Map</div>
		<label class="py-1">
			<span class="split">
				<span>Width</span>
				<output>{options.MAP_WIDTH}</output>
			</span>
			<input
				type="range"
				min="20"
				max="100"
				bind:value={options.MAP_WIDTH}
				class="d-range" />
		</label>
		<label class="py-1">
			<span class="split">
				<span>Height</span>
				<output>{options.MAP_HEIGHT}</output>
			</span>
			<input
				type="range"
				min="20"
				max="100"
				bind:value={options.MAP_HEIGHT}
				class="d-range" />
		</label>
		{@render typeInput()}
	</div>
{/snippet}
{#snippet typeInput()}
	<div style="display: contents;">
		<div class="mt-4 text-lg font-bold">Engine</div>
		{#each ['Digger', 'Uniform'] as engine (engine)}
			{@const isActive = options.MAP_TYPE === engine}
			<label class="split py-1">
				<span class:font-semibold={isActive} class:text-base={isActive}
					>{engine}</span>
				<input
					type="radio"
					bind:group={options.MAP_TYPE}
					class="d-radio checked:text-base-content"
					value={engine} />
			</label>
		{/each}
	</div>
{/snippet}
{#snippet dispInput()}
	<div style="display: contents;">
		<div class="my-1 text-lg font-bold">World</div>
		<label class="py-1">
			<span class="split">
				<span>Width</span>
				<output>{options.VIEW_WIDTH}</output>
			</span>
			<input
				type="range"
				min="4"
				max="35"
				bind:value={options.VIEW_WIDTH}
				class="d-range" />
		</label>

		<label class="py-1">
			<span class="split">
				<span>Height</span>
				<output>{options.VIEW_HEIGHT}</output>
			</span>
			<input
				type="range"
				min="4"
				max="35"
				bind:value={options.VIEW_HEIGHT}
				class="d-range" />
		</label>
		<div class="mt-4 text-lg font-bold">Scale</div>
		<label class="py-1">
			<span class="split">
				<span>Tile Size</span>
				<output>{options.TILE_SIZE}</output>
			</span>
			<input
				type="range"
				min="1"
				max="60"
				bind:value={options.TILE_SIZE}
				class="d-range" />
		</label>
	</div>
{/snippet}
