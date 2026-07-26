function copyToClip(text: string) {
	return navigator.clipboard.writeText(text).then(
		function () {
			console.log('Copying to clipboard was successful!', text.length)
			return text
		},
		function (err) {
			console.error('Async: Could not copy text: ', err)
		}
	)
}
export default copyToClip
