export default (milliseconds = 1000) =>
	new Promise((resolve) => setTimeout(resolve, milliseconds))
