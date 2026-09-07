// place files you want to import through the `$lib` alias in this folder.
// @index('./utils/*.ts', (f, _) => `export { default as ${_.camelCase(f.name)} } from '${f.path}'`)
export { default as assetLoader } from './utils/assetLoader'
export { default as copyToClip } from './utils/copyToClip'
export { default as getFighter } from './utils/getFighter'
export { default as getKey } from './utils/getKey'
export { default as getMsg } from './utils/getMsg'
export { default as parseKey } from './utils/parseKey'
export { default as parseNumber } from './utils/parseNumber'
export { default as randNum } from './utils/randNum'
export { default as randRow } from './utils/randRow'
export { default as shuffle } from './utils/shuffle'
export { default as sleep } from './utils/sleep'
export { default as typewriter } from './utils/typewriter'
export { default as uuid } from './utils/uuid'
// @endindex
// @index('./comp/*.svelte', (f, _) => `export { default as ${_.pascalCase(f.name)} } from '${f.path}${f.ext}'`)

// @endindex
// @index('./components/**/*.svelte', (f, _) => `export { default as ${_.pascalCase(f.name)} } from '${f.path}${f.ext}'`)
export { default as Button } from './components/Button.svelte'
export { default as Dialog } from './components/Dialog.svelte'
export { default as Icon } from './components/Icon.svelte'
export { default as Log } from './components/Log.svelte'
export { default as Portal } from './components/Portal.svelte'
export { default as Sprites } from './components/sprites.svelte'
// @endindex

export const nav = [
	{
		href: '/',
		name: 'Lobby',
		icon: 'icon-home',
		slug: 'lobby',
		hidden: true
	},
	{
		href: '/game',
		name: 'Game',
		icon: 'icon-book',
		slug: 'game',
		hidden: false
	},
	{
		href: '/settings',
		name: 'Settings',
		icon: 'icon-settings',
		slug: 'settings',
		hidden: false
	}
]
