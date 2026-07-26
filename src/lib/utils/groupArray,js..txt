import depaginate from './depaginate'
const groupArray = (array = []) => {
	let set1 = new Set()
	const arr = depaginate(array)
	for (const val of arr) {
		set1.add(val)
	}

	if (set1.has(0)) set1.delete(0)
	if (set1.has(1)) set1.delete(1)
	return [...set1]
}

export default groupArray
