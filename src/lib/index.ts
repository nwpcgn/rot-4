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
		hidden: false
	},
	{
		href: '/game',
		name: 'Game',
		icon: 'icon-server',
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

export const iconList = [
	{
		id: 0,
		group: 'icon',
		name: 'activity',
		icon: 'icon-activity'
	},
	{
		id: 1,
		group: 'icon',
		name: 'alert-error',
		icon: 'icon-alert-error'
	},
	{
		id: 2,
		group: 'icon',
		name: 'archive',
		icon: 'icon-archive'
	},
	{
		id: 3,
		group: 'icon',
		name: 'at-sign',
		icon: 'icon-at-sign'
	},
	{
		id: 4,
		group: 'icon',
		name: 'award',
		icon: 'icon-award'
	},
	{
		id: 5,
		group: 'icon',
		name: 'book',
		icon: 'icon-book'
	},
	{
		id: 6,
		group: 'icon',
		name: 'bookmark',
		icon: 'icon-bookmark'
	},
	{
		id: 7,
		group: 'icon',
		name: 'success',
		icon: 'icon-success'
	},
	{
		id: 8,
		group: 'icon',
		name: 'chevron-down',
		icon: 'icon-chevron-down'
	},
	{
		id: 9,
		group: 'icon',
		name: 'chevron-left',
		icon: 'icon-chevron-left'
	},
	{
		id: 10,
		group: 'icon',
		name: 'chevron-right',
		icon: 'icon-chevron-right'
	},
	{
		id: 11,
		group: 'icon',
		name: 'chevron-up',
		icon: 'icon-chevron-up'
	},
	{
		id: 12,
		group: 'icon',
		name: 'compass',
		icon: 'icon-compass'
	},
	{
		id: 13,
		group: 'icon',
		name: 'database',
		icon: 'icon-database'
	},
	{
		id: 14,
		group: 'icon',
		name: 'delete',
		icon: 'icon-delete'
	},
	{
		id: 15,
		group: 'icon',
		name: 'grid',
		icon: 'icon-grid'
	},
	{
		id: 16,
		group: 'icon',
		name: 'home',
		icon: 'icon-home'
	},
	{
		id: 17,
		group: 'icon',
		name: 'info',
		icon: 'icon-info'
	},
	{
		id: 18,
		group: 'icon',
		name: 'map',
		icon: 'icon-map'
	},
	{
		id: 19,
		group: 'icon',
		name: 'map-pin',
		icon: 'icon-map-pin'
	},
	{
		id: 20,
		group: 'icon',
		name: 'menu',
		icon: 'icon-menu'
	},
	{
		id: 21,
		group: 'icon',
		name: 'rotate-l',
		icon: 'icon-rotate-l'
	},
	{
		id: 22,
		group: 'icon',
		name: 'rotate-r',
		icon: 'icon-rotate-r'
	},
	{
		id: 23,
		group: 'icon',
		name: 'search',
		icon: 'icon-search'
	},
	{
		id: 24,
		group: 'icon',
		name: 'server',
		icon: 'icon-server'
	},
	{
		id: 25,
		group: 'icon',
		name: 'settings',
		icon: 'icon-settings'
	},
	{
		id: 26,
		group: 'icon',
		name: 'trash',
		icon: 'icon-trash'
	},
	{
		id: 27,
		group: 'icon',
		name: 'user',
		icon: 'icon-user'
	},
	{
		id: 28,
		group: 'icon',
		name: 'users',
		icon: 'icon-users'
	},
	{
		id: 29,
		group: 'icon',
		name: 'volume-on',
		icon: 'icon-volume-on'
	},
	{
		id: 30,
		group: 'icon',
		name: 'volume-off',
		icon: 'icon-volume-off'
	}
]
