<script lang="ts">
	let {
		icon = '',
		size,
		xs,
		sm,
		lg,
		xl
	}: {
		icon: string
		size: number
		xs: boolean
		sm: boolean
		lg: boolean
		xl: boolean
	} = $props()
	const iconClass = `nwp-icon`
</script>

{#if !size}
	<svg
		class={iconClass}
		class:icon-xs={xs}
		class:icon-sm={sm}
		class:icon-lg={lg}
		class:icon-xl={xl}>
		{@render T1(icon)}</svg>
{:else}
	<svg width={size} height={size}>{@render T1(icon)}</svg>
{/if}
{#snippet T1(icon = '')}<use xlink:href="#{icon}"></use>{/snippet}
