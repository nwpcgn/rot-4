interface Loader {
	images: { [key: string]: HTMLImageElement }
	loadImage(key: string, src: string): Promise<HTMLImageElement>
	getImage(key: string): HTMLImageElement | null
}

export const Loader: Loader = {
	images: {},

	loadImage: function (key: string, src: string): Promise<HTMLImageElement> {
		const img = new Image()

		const d = new Promise<HTMLImageElement>((resolve, reject) => {
			img.onload = () => {
				this.images[key] = img
				resolve(img)
			}

			img.onerror = () => {
				reject('Could not load image: ' + src)
			}
		})

		img.src = src
		return d
	},

	getImage: function (key: string): HTMLImageElement | null {
		return key in this.images ? this.images[key] : null
	}
}
export default Loader
