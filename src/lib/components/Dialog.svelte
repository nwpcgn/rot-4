<script>
	import Portal from './Portal.svelte'
	let {
		showModal = $bindable(),
		children,
		footer,
		header,
		autoClose,
		top,
		middle,
		bottom,
		start,
		end,
		small,
		blank
	} = $props()
	let dialog = $state()

	const smallClass = (small) => (small ? 'w-11/12 max-w-xl' : '')

	const handleCloseAction = () => {
		showModal = false
	}

	$effect(() => {
		if (showModal && dialog) dialog.showModal()
		if (!showModal) handleCloseAction()
	})
</script>

<Portal targetId="portals">
	<dialog
		class="modal {smallClass(small)}"
		bind:this={dialog}
		onclose={handleCloseAction}
		class:modal-top={top}
		class:modal-middle={middle}
		class:modal-bottom={bottom}
		class:modal-start={start}
		class:modal-end={end}>
		<div class="modal-box" class:p-0={blank}>
			{@render header?.()}
			{@render children?.()}
			{@render footer?.()}
		</div>
		{#if autoClose}
			<form method="dialog" class="modal-backdrop">
				<button value="CLOSE">close</button>
			</form>
		{/if}
	</dialog>
</Portal>
