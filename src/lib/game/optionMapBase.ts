export const optionMapBase = {
	width: 50,
	height: 30,
	algorithm: 'digger',
	roomWidth: [4, 8] /* room minimum and maximum width */,
	roomHeight: [3, 6] /* room minimum and maximum height */,
	corridorLength: [3, 10] /* corridor minimum and maximum length */,
	dugPercentage: 0.3 /* we stop after this percentage of level area has been dug out */,
	roomDugPercentage: 0.1 /* we stop after this much time has passed (msec) */
}

export default optionMapBase
