<script lang="ts">
	let { onReset }: { onReset: () => void } = $props()
</script>

<div class="overlay">
	<div class="box">
		<div class="title">☠ GAME OVER</div>
		<p class="sub">Du wurdest besiegt.</p>
		<button onclick={onReset}>↺ Neu starten</button>
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		background: oklch(0% 0 0 / 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.box {
		font-family: monospace;
		background: oklch(14% 0 0);
		border: 1px solid oklch(57.7% 0.245 27.325);
		padding: 2rem 3rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.title {
		font-size: 1.5rem;
		color: oklch(57.7% 0.245 27.325);
		letter-spacing: 0.2em;
	}

	.sub {
		font-size: 0.8rem;
		color: oklch(55% 0 0);
		margin: 0;
	}

	button {
		margin-top: 0.5rem;
		padding: 0.4rem 1.5rem;
		font-family: monospace;
		font-size: 0.8rem;
		cursor: pointer;
		background: oklch(20% 0 0);
		border: 1px solid oklch(45% 0 0);
		color: oklch(85% 0 0);
		letter-spacing: 0.1em;
		transition:
			border-color 0.15s,
			color 0.15s;
	}

	button:hover {
		border-color: oklch(0.7588 0.2948 142.51);
		color: oklch(0.7588 0.2948 142.51);
	}
</style>
