<script lang="ts">
	import {
		Router,
		Route,
		Fallback,
		RouterTrace,
		location
	} from '@svelte-router/core'
	import Game from './game/Game.svelte'
	import { Sprites, Log, sleep, nav } from '$lib'
	//	import { logger } from '$lib/components/logger.svelte.ts'

	let options = $state({
		VIEW_WIDTH: 20,
		VIEW_HEIGHT: 12,
		MAP_WIDTH: 60,
		MAP_HEIGHT: 40,
		TILE_SIZE: 38
	})

	let promise = $state(sleep(400))
</script>

<div class="navbar bg-neutral text-neutral-content shadow-sm">
	<div class="flex-1">
		<button
			class="btn text-xl btn-neutral"
			onclick={() => (promise = sleep(200))}>nwpUI</button>
	</div>
	<div class="flex-none">
		<ul class="menu menu-horizontal px-1">
			{#each nav as { href, name, slug } (href)}
				<li><a href="#{href}" aria-label={slug}>{name}</a></li>
			{/each}
		</ul>
	</div>
</div>

<main class="main">
	{#await promise}
		<!-- promise is pending -->
	{:then _}
		<Router>
			<Game {options}></Game>
			<Route path="/" key="lobby">
				<section class="page nwp">
					<article><h4>Lobby</h4></article>
				</section>
			</Route>
			<Route path="/game" key="game">
				<section class="page nwp"><article><h4>Game</h4></article></section>
			</Route>
			<Route path="/settings" key="settings">
				<section class="page nwp"><article><h4>Settings</h4></article></section>
			</Route>
		</Router>
	{/await}
</main>
<div id="portals"></div>
<Sprites />
