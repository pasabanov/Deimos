// ==== State ====
const MQ = MathQuill.getInterface(2);

const state = {
	functions: [],
	colors: ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#06b6d4', '#f97316', '#10b981', '#f43f5e', '#64748b'],
	colorIndex: 0,
	world: { xmin: -10, xmax: 10, ymin: -10, ymax: 10 },
	drag: { active: false, x: 0, y: 0, worldStart: null }
};


// ==== DOM Refs ====
const el = {
	canvas: document.getElementById('canvas'),
	sidebar: document.getElementById('sidebar'),
	fnList: document.getElementById('fn-list'),
	addBtn: document.getElementById('add-fn'),
	ranges: document.getElementById('ranges')
};

const ctx = el.canvas.getContext('2d');


// ==== Canvas Helpers ====
function resizeCanvas() {
	const dpr = window.devicePixelRatio || 1;
	const rect = el.canvas.getBoundingClientRect();

	el.canvas.width = Math.floor(rect.width * dpr);
	el.canvas.height = Math.floor(rect.height * dpr);

	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

	draw();
}

window.addEventListener('resize', resizeCanvas);

function worldToScreen(x, y) {
	const w = el.canvas.clientWidth;
	const h = el.canvas.clientHeight;

	const sx = (x - state.world.xmin) * (w / (state.world.xmax - state.world.xmin));
	const sy = h - (y - state.world.ymin) * (h / (state.world.ymax - state.world.ymin));

	return { x: sx, y: sy };
}

function screenToWorld(sx, sy) {
	const w = el.canvas.clientWidth;
	const h = el.canvas.clientHeight;

	const x = state.world.xmin + sx * (state.world.xmax - state.world.xmin) / w;
	const y = state.world.ymin + (h - sy) * (state.world.ymax - state.world.ymin) / h;

	return { x, y };
}

function niceStep(raw) {
	const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
	const n = raw / pow10;

	let step;
	if (n < 1.5) {
		step = 1;
	} else if (n < 3) {
		step = 2;
	} else if (n < 7) {
		step = 5;
	} else {
		step = 10;
	}

	return step * pow10;
}

function round(v) {
	const s = (state.world.xmax - state.world.xmin);
	const d = Math.max(0, 2 - Math.floor(Math.log10(Math.max(1e-9, s))));
	return Number(v.toFixed(d));
}


// ==== Grid Rendering ====
function drawGrid() {
	const w = el.canvas.clientWidth;
	const h = el.canvas.clientHeight;

	ctx.clearRect(0, 0, w, h);

	ctx.strokeStyle = '#aaa';
	ctx.lineWidth = 1;

	const stepX = niceStep((state.world.xmax - state.world.xmin) / 10);
	const stepY = niceStep((state.world.ymax - state.world.ymin) / 10);

	let x = Math.ceil(state.world.xmin / stepX) * stepX;
	while (x <= state.world.xmax) {
		const p1 = worldToScreen(x, state.world.ymin);
		const p2 = worldToScreen(x, state.world.ymax);

		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();

		x += stepX;
	}

	let y = Math.ceil(state.world.ymin / stepY) * stepY;
	while (y <= state.world.ymax) {
		const p1 = worldToScreen(state.world.xmin, y);
		const p2 = worldToScreen(state.world.xmax, y);

		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();

		y += stepY;
	}

	ctx.strokeStyle = '#111';
	ctx.lineWidth = 1;

	const pOx1 = worldToScreen(state.world.xmin, 0);
	const pOx2 = worldToScreen(state.world.xmax, 0);
	const pOy1 = worldToScreen(0, state.world.ymin);
	const pOy2 = worldToScreen(0, state.world.ymax);

	ctx.beginPath();
	ctx.moveTo(pOx1.x, pOx1.y);
	ctx.lineTo(pOx2.x, pOx2.y);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(pOy1.x, pOy1.y);
	ctx.lineTo(pOy2.x, pOy2.y);
	ctx.stroke();
}


// ==== Function Rendering ====
function drawFunctions() {
	const w = el.canvas.clientWidth;

	for (const f of state.functions) {
		if (!f.visible) {
			continue;
		}

		ctx.strokeStyle = f.color;
		ctx.lineWidth = 2;
		ctx.beginPath();

		let first = true;
		const samples = Math.max(400, w);

		for (let i = 0; i <= samples; ++i) {
			const sx = i * (w / samples);
			const { x } = screenToWorld(sx, 0);

			let y;
			try {
				y = f.fn(x);
				if (!isFinite(y)) {
					y = NaN;
				}
			} catch (e) {
				y = NaN;
			}

			if (isNaN(y)) {
				first = true;
				continue;
			}

			const p = worldToScreen(x, y);

			if (first) {
				ctx.moveTo(p.x, p.y);
				first = false;
			} else {
				ctx.lineTo(p.x, p.y);
			}
		}

		ctx.stroke();
	}
}

function draw() {
	drawGrid();
	drawFunctions();

	el.ranges.textContent = `x: [${round(state.world.xmin)}, ${round(state.world.xmax)}]  y: [${round(state.world.ymin)}, ${round(state.world.ymax)}]`;
}


// ==== Sidebar UI / Function Editor ====
function addFunction(initial) {
	const id = crypto.randomUUID();
	const color = state.colors[state.colorIndex % state.colors.length];
	++state.colorIndex;

	const wrapper = document.createElement('div');
	wrapper.className = 'fn-item';
	wrapper.dataset.id = id;

	const colorDot = document.createElement('div');
	colorDot.className = 'fn-color';
	colorDot.style.background = color;

	const mqHost = document.createElement('div');
	mqHost.className = 'fn-mq';

	const del = document.createElement('div');
	del.className = 'fn-delete';

	wrapper.appendChild(colorDot);
	wrapper.appendChild(mqHost);
	wrapper.appendChild(del);
	el.fnList.appendChild(wrapper);

	let obj = {
		id,
		color,
		field: null,
		visible: true,
		fn: x => NaN
	};

	const field = MQ.MathField(mqHost, {
		spaceBehavesLikeTab: true,
		autoCommands: 'pi theta sqrt',
		autoOperatorNames: 'sin cos tan cot sec csc asin acos atan ln lg'
	});
	obj.field = field;

	if (initial) {
		field.latex(initial);
	}

	function onChange() {
		const latex = field.latex().trim();

		if (!latex) {
			obj.fn = x => NaN;
			draw();
			return;
		}

		try {
			obj.fn = compileLatex(latex);
		} catch (e) {
			obj.fn = x => NaN;
		}

		draw();
	}

	field.config({ handlers: { edit: onChange } });

	state.functions.push(obj);

	colorDot.addEventListener('click', () => {
		const off = colorDot.classList.toggle('off');
		if (off) {
			colorDot.style.background = 'none';
			colorDot.style.border = `4px solid ${color}`;
		} else {
			colorDot.style.background = color;
			colorDot.style.border = 'none';
		}
		obj.visible = !off;
		draw();
	});

	del.addEventListener('click', () => {
		const idx = state.functions.findIndex(x => x.id === id);
		if (idx >= 0) {
			state.functions.splice(idx, 1);
		}
		wrapper.remove();
		draw();
	});

	onChange();
}


// ==== Mouse, Wheel, Keyboard Events ====
function onWheel(e) {
	e.preventDefault();

	const rect = el.canvas.getBoundingClientRect();
	const sx = e.clientX - rect.left;
	const sy = e.clientY - rect.top;

	const p = screenToWorld(sx, sy);
	const scale = e.deltaY < 0 ? 0.9 : 1.1;

	const nxmin = p.x + (state.world.xmin - p.x) * scale;
	const nxmax = p.x + (state.world.xmax - p.x) * scale;
	const nymin = p.y + (state.world.ymin - p.y) * scale;
	const nymax = p.y + (state.world.ymax - p.y) * scale;

	state.world = { xmin: nxmin, xmax: nxmax, ymin: nymin, ymax: nymax };

	draw();
}

function onDown(e) {
	state.drag.active = true;
	state.drag.x = e.clientX;
	state.drag.y = e.clientY;
	state.drag.worldStart = { ...state.world };
}

function onMove(e) {
	if (!state.drag.active) {
		return;
	}

	const dx = e.clientX - state.drag.x;
	const dy = e.clientY - state.drag.y;

	const p1 = screenToWorld(0, 0);
	const p2 = screenToWorld(dx, dy);

	const ddx = p1.x - p2.x;
	const ddy = p1.y - p2.y;

	state.world = {
		xmin: state.drag.worldStart.xmin + ddx,
		xmax: state.drag.worldStart.xmax + ddx,
		ymin: state.drag.worldStart.ymin + ddy,
		ymax: state.drag.worldStart.ymax + ddy
	};

	draw();
}

function onUp() {
	state.drag.active = false;
}


// ==== Init ====
function init() {
	resizeCanvas();

	addFunction('y=x');
	addFunction('y=\\sin(x)');

	el.addBtn.addEventListener('click', () => addFunction('y='));

	el.canvas.addEventListener('wheel', onWheel, { passive: false });
	el.canvas.addEventListener('mousedown', onDown);

	window.addEventListener('mousemove', onMove);
	window.addEventListener('mouseup', onUp);

	window.addEventListener('keydown', e => {
		if (e.key.toLowerCase() === 'd') {
			state.world = { xmin: -10, xmax: 10, ymin: -10, ymax: 10 };
			draw();
		}
	});
}

window.addEventListener('load', init);