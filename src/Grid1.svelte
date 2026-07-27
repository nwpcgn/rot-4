<script lang="ts">
	import { board, ships, SIZE } from './lib/stores'
	let { cellEls = [], showPreview, clearPreview, attemptPlace } = $props()
</script>

<div class="ship-grid">
	<div class="bg-info"></div>
	{@render bars()}
	<div class="ship-map">
		{#each cellEls as { index, x, y, pre, valid, ship }, i (i)}
			<span
				onmouseenter={() => showPreview(x, y)}
				onmouseleave={() => clearPreview()}
				onclick={() => attemptPlace(x, y)}
				class="cell"
				class:ship
				class:preview-ok={pre && valid}
				class:preview-bad={pre && !valid}
				data-pre={pre}
				data-valid={valid}
				data-x={x}
				data-y={y}
				data-index={index}></span>
		{/each}
	</div>
</div>

{#snippet bars()}
	<div class="bar-h">
		{#each Array.from({ length: SIZE }, (_, i) => i) as item, x (x)}
			<span class="bg-base-300 font-bold">
				{String.fromCharCode(65 + x)}
			</span>
		{/each}
	</div>
	<div class="bar-v">
		{#each Array.from({ length: SIZE }, (_, i) => i) as item, y (y)}
			<span class="bg-base-300 font-bold">
				{y + 1}
			</span>
		{/each}
	</div>
{/snippet}

<style>
	:root {
		--tile-size: 42px;

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

	.ship-grid {
		display: grid;
		grid-template-columns: var(--tile-size) 1fr;
		grid-template-rows: var(--tile-size) 1fr;
		gap: 0.25rem;
		grid-auto-flow: row;
		grid-template-areas:
			'. bar-h'
			'bar-v ship-map';
	}
	.bar-h {
		display: grid;
		grid-template-columns: repeat(10, minmax(var(--tile-size), 1fr));
		grid-template-rows: 1fr;
		grid-template-areas: '. . .';
		grid-area: bar-h;
		gap: 1px;
	}
	.bar-v {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: repeat(10, minmax(var(--tile-size), 1fr));
		grid-area: bar-v;
		gap: 1px;
	}
	.ship-map {
		display: grid;
		grid-template-columns: repeat(10, minmax(var(--tile-size), 1fr));
		grid-template-rows: repeat(10, minmax(var(--tile-size), 1fr));
		grid-area: ship-map;
		gap: 1px;
	}
	.ship-map > *,
	.bar-v > *,
	.bar-h > * {
		display: grid;
		place-content: center;
		aspect-ratio: 1/1;
		width: var(--tile-size);
	}

	.cell {
		background: var(--water);
		position: relative;
		cursor: pointer;
		transition: background 0.2s ease;
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
		background: oklch(0.508 0.118 165.612);
	}
	.cell.preview-bad {
		background: oklch(0.514 0.222 16.935);
	}
</style>
