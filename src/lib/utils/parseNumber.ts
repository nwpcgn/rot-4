export const parseNumber = (v: number, count: number = 2) =>
	v.toString().padStart(count, '0')
export default parseNumber
