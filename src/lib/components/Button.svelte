<script lang="ts">
	let {
		href,
		active,
		accent,
		error,
		info,
		neutral,
		primary,
		secondary,
		success,
		warning,
		square,
		label,
		disabled,
		children,
		onClick
	} = $props()
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	{href}
	{disabled}
	onclick={onClick}
	role={href ? '' : 'button'}
	aria-label={label}
	class="btn"
	class:active
	class:btn-accent={accent}
	class:btn-error={error}
	class:btn-info={info}
	class:btn-neutral={neutral}
	class:btn-primary={primary}
	class:btn-secondary={secondary}
	class:btn-success={success}
	class:btn-warning={warning}
	class:btn-square={square}>
	{@render children?.()}
</svelte:element>
