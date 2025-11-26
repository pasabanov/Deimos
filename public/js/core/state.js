const state = {
	functions: [],
	defaultLogBase: Math.E,
	colors: ['#c74440', '#2d70b3', '#348543', '#fa7e19', '#6042a6', '#000000'],
	colorIndex: 0,
	world: { xmin: -10, xmax: 10, ymin: -10, ymax: 10 },
	drag: { active: false, x: 0, y: 0, worldStart: null },
};

const el = {
	canvas: document.getElementById('canvas'),
	sidebar: document.getElementById('sidebar'),
	fnList: document.getElementById('fn-list'),
	addBtn: document.getElementById('add-fn'),
	ranges: document.getElementById('ranges'),
	app: document.getElementById('app'),
	resizer: document.getElementById('resizer'),
};

export { state, el };