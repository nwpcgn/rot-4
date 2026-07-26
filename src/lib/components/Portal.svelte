<script>
	import { mount, unmount, onMount } from 'svelte'

	let { targetId, children } = $props()
	let instance = null
	let container = null

	onMount(() => {
		// Das Ziel-Element im DOM finden
		container = document.getElementById(targetId)

		if (container) {
			// Den Inhalt (children) in das Ziel-Element mounten
			instance = mount(children, {
				target: container
			})
		}

		// Cleanup: Wird ausgeführt, wenn die Portal-Komponente entfernt wird
		return () => {
			if (instance) {
				unmount(instance)
			}
		}
	})
</script>

{@render children?.()}
