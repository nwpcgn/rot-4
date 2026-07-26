<script lang="ts">
	import { slide } from 'svelte/transition'
	import logger from './logger.svelte.ts'
	import Icon from './Icon.svelte'
	import typewriter from '$lib/utils/typewriter'
	export interface Note {
		id?: string
		type: string
		message: string
		dismissible: boolean
		timeout: number
	}
	const icons = {
		info: 'icon-info',
		error: 'icon-alert',
		warning: 'icon-alert',
		success: 'icon-info'
	}

	const clear = () => {
		logger.clear()
	}

	const showDemo = (size = 5) => {
		logger.demo(size)
	}

	const next = () => {
		const res = logger.shift()
		console.log('next', res)
	}

	const bar = [
		// ['Demo', showDemo],
		['btn-info', next, 'pkmn-right'],
		['btn-error', clear, 'pkmn-close']
	]
</script>

{#if logger.list.length || logger.buffer.length}
	<header class="absolute top-0 right-0 z-10 bg-base-200">
		<nav class="nav gap-1 p-1">
			{#each bar as [label, fn, icon], i (i)}
				<button
					class="btn join-item btn-square btn-sm {label}"
					onclick={() => fn()}>
					<span class="sr-only">{label}</span>
					<Icon size={20} {icon} />
				</button>
			{/each}
			<span
				class="grid size-8 place-content-center bg-primary text-primary-content">
				<label>{logger.list.length}</label></span>
			<span
				class="grid size-8 place-content-center bg-secondary text-secondary-content">
				<label>{logger.buffer.length}</label></span>
		</nav>
	</header>
{/if}
<div class="padded">
	{#each logger.list as log (log.id)}
		{@render logBox({ ...log })}
	{:else}
		<div class="callout split">
			<span>Logs</span>
			<nav class="nav">
				<button class="btn btn-primary btn-xs" onclick={() => showDemo()}
					>Demo</button>
			</nav>
		</div>
	{/each}
</div>
{#snippet logBox(obj: Note)}
	<div transition:slide|global={{ axis: 'y', duration: 800 }}>
		<div class="log nav log-{obj.type}" out:slide>
			<Icon icon={icons[obj.type]} />
			<div class="flex-1">
				<span in:typewriter={{ speed: logger.speed }}>{obj.message}</span>
			</div>
			<button
				class="btn btn-{obj.type} btn-square btn-sm"
				onclick={() => next()}><Icon icon="pkmn-close" size={20} /></button>
		</div>
	</div>
{/snippet}
