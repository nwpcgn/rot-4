<script lang="ts">
	import { Tween } from 'svelte/motion'
	import { cubicOut } from 'svelte/easing'

	let progress = new Tween(0, {
		duration: 400,
		easing: cubicOut
	})
	let { min = 0, max = 100, value = 89 } = $props()

	let minimal = $derived(max * 0.1)

	$effect(() => {
		progress.target = value
	})
</script>

<progress
	class="f-full progress transition-colors duration-200 ease-in"
	style="--radius-box: 0rem;"
	class:progress-error={progress.current <= minimal}
	class:progress-info={progress.current > minimal}
	{min}
	{max}
	value={progress.current}></progress>
