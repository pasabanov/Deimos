// ==== State ====
const MQ = MathQuill.getInterface(2);

const state = {
	functions: [],
	colors: ['#c74440', '#2d70b3', '#348543', '#fa7e19', '#6042a6', '#000000'],
	colorIndex: 0,
	world: { xmin: -10, xmax: 10, ymin: -10, ymax: 10 },
	drag: { active: false, x: 0, y: 0, worldStart: null },
};


// ==== DOM Refs ====
const el = {
	canvas: document.getElementById('canvas'),
	sidebar: document.getElementById('sidebar'),
	fnList: document.getElementById('fn-list'),
	addBtn: document.getElementById('add-fn'),
	ranges: document.getElementById('ranges'),
};

const ctx = el.canvas.getContext('2d');


// ==== Canvas Helpers ====
function reflowWorldToCanvas() {
	const w = el.canvas.clientWidth;
	const h = el.canvas.clientHeight;
	const rangeX = state.world.xmax - state.world.xmin;
	if (rangeX <= 0) {
		return;
	}
	const ppx = w / rangeX;
	const rangeY = h / ppx;
	const cy = (state.world.ymin + state.world.ymax) * 0.5;
	state.world.ymin = cy - rangeY * 0.5;
	state.world.ymax = cy + rangeY * 0.5;
}

function resizeCanvas() {
	const dpr = window.devicePixelRatio || 1;
	const rect = el.canvas.getBoundingClientRect();
	el.canvas.width = Math.floor(rect.width * dpr);
	el.canvas.height = Math.floor(rect.height * dpr);
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	reflowWorldToCanvas();
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

function computeGridStep(ppu) {
	const targetPx = 70;
	const raw = targetPx / Math.max(1e-12, ppu);
	const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
	const n = raw / pow10;
	let base;
	if (n <= 1) {
		base = 1;
	} else if (n <= 2) {
		base = 2;
	} else if (n <= 5) {
		base = 5;
	} else {
		base = 10;
	}
	return { step: base * pow10, base };
}

function formatTick(v, step) {
	const mag = Math.max(0, -Math.floor(Math.log10(step)));
	const s = v.toFixed(Math.min(10, mag));
	if (s.indexOf('.') < 0) {
		return s;
	}
	return s.replace(/\.?0+$/, '');
}


// ==== Grid Rendering ====
function drawGrid() {
	const w = el.canvas.clientWidth;
	const h = el.canvas.clientHeight;

	ctx.clearRect(0, 0, w, h);

	const rangeX = state.world.xmax - state.world.xmin;
	const rangeY = state.world.ymax - state.world.ymin;

	const ppu = Math.min(w / rangeX, h / rangeY);
	const { step: stepMajor, base } = computeGridStep(ppu);
	const minors = base === 2 ? 3 : 4;
	const stepMinor = stepMajor / (minors + 1);

	const xStartMajor = Math.ceil(state.world.xmin / stepMajor) * stepMajor;
	const yStartMajor = Math.ceil(state.world.ymin / stepMajor) * stepMajor;

	const xStartMinor = Math.ceil(state.world.xmin / stepMinor) * stepMinor;
	const yStartMinor = Math.ceil(state.world.ymin / stepMinor) * stepMinor;

	ctx.lineWidth = 1;
	ctx.strokeStyle = '#e0e0e0';

	for (let x = xStartMinor; x <= state.world.xmax + 1e-12; x += stepMinor) {
		const k = Math.round((x - xStartMajor) / stepMajor);
		const isMajorAligned = Math.abs(x - (xStartMajor + k * stepMajor)) <= stepMinor * 0.5e-3;
		if (isMajorAligned) continue;
		const p1 = worldToScreen(x, state.world.ymin);
		const p2 = worldToScreen(x, state.world.ymax);
		ctx.beginPath();
		ctx.moveTo(Math.round(p1.x) + 0.5, p1.y);
		ctx.lineTo(Math.round(p2.x) + 0.5, p2.y);
		ctx.stroke();
	}

	for (let y = yStartMinor; y <= state.world.ymax + 1e-12; y += stepMinor) {
		const k = Math.round((y - yStartMajor) / stepMajor);
		const isMajorAligned = Math.abs(y - (yStartMajor + k * stepMajor)) <= stepMinor * 0.5e-3;
		if (isMajorAligned) continue;
		const p1 = worldToScreen(state.world.xmin, y);
		const p2 = worldToScreen(state.world.xmax, y);
		ctx.beginPath();
		ctx.moveTo(p1.x, Math.round(p1.y) + 0.5);
		ctx.lineTo(p2.x, Math.round(p2.y) + 0.5);
		ctx.stroke();
	}

	ctx.strokeStyle = '#999';

	for (let x = xStartMajor; x <= state.world.xmax + 1e-12; x += stepMajor) {
		const p1 = worldToScreen(x, state.world.ymin);
		const p2 = worldToScreen(x, state.world.ymax);
		ctx.beginPath();
		ctx.moveTo(Math.round(p1.x) + 0.5, p1.y);
		ctx.lineTo(Math.round(p2.x) + 0.5, p2.y);
		ctx.stroke();
	}

	for (let y = yStartMajor; y <= state.world.ymax + 1e-12; y += stepMajor) {
		const p1 = worldToScreen(state.world.xmin, y);
		const p2 = worldToScreen(state.world.xmax, y);
		ctx.beginPath();
		ctx.moveTo(p1.x, Math.round(p1.y) + 0.5);
		ctx.lineTo(p2.x, Math.round(p2.y) + 0.5);
		ctx.stroke();
	}

	const ox = worldToScreen(0, 0).x;
	const oy = worldToScreen(0, 0).y;

	ctx.lineWidth = 1;
	ctx.strokeStyle = '#999';

	if (ox >= 0 && ox <= w) {
		ctx.beginPath();
		ctx.moveTo(Math.round(ox) + 0.5, 0);
		ctx.lineTo(Math.round(ox) + 0.5, h);
		ctx.stroke();
	}
	if (oy >= 0 && oy <= h) {
		ctx.beginPath();
		ctx.moveTo(0, Math.round(oy) + 1.5);
		ctx.lineTo(w, Math.round(oy) + 1.5);
		ctx.stroke();
	}

	ctx.strokeStyle = '#111';

	if (ox >= 0 && ox <= w) {
		ctx.beginPath();
		ctx.moveTo(Math.round(ox) + 1.5, 0);
		ctx.lineTo(Math.round(ox) + 1.5, h);
		ctx.stroke();
	}
	if (oy >= 0 && oy <= h) {
		ctx.beginPath();
		ctx.moveTo(0, Math.round(oy) + 0.5);
		ctx.lineTo(w, Math.round(oy) + 0.5);
		ctx.stroke();
	}

	ctx.fillStyle = '#111';
	ctx.strokeStyle = '#fff';
	ctx.lineWidth = 4;
	ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif';
	ctx.textBaseline = 'top';
	ctx.textAlign = 'center';

	const yAxisScreen = oy >= 0 && oy <= h ? Math.round(oy) + 6 : (oy < 0 ? 4 : h - 16);

	for (let x = xStartMajor; x <= state.world.xmax + 1e-12; x += stepMajor) {
		if (Math.abs(x) < stepMajor * 1e-9) {
			continue;
		}

		const p = worldToScreen(x, 0);
		if (p.x < -20 || p.x > w + 20) {
			continue;
		}

		const label = formatTick(x, stepMajor);
		let drawX = Math.round(p.x);

		if (label[0] === '-') {
			drawX -= ctx.measureText('-').width / 2;
		}

		ctx.strokeText(label, drawX, yAxisScreen);
		ctx.fillText(label, drawX, yAxisScreen);
	}

	ctx.textAlign = 'right';
	ctx.textBaseline = 'middle';

	const xAxisScreen = (ox >= 0 && ox <= w ? Math.round(ox) - 3 : (ox < 0 ? 16 : w - 3));

	for (let y = yStartMajor; y <= state.world.ymax + 1e-12; y += stepMajor) {
		if (Math.abs(y) < stepMajor * 1e-9) {
			continue;
		}
		const p = worldToScreen(0, y);
		if (p.y < -20 || p.y > h + 20) {
			continue;
		}

		const label = formatTick(y, stepMajor);

		const drawY = Math.round(p.y) + 0.5;

		ctx.strokeText(label, xAxisScreen, drawY);
		ctx.fillText(label, xAxisScreen, drawY);
	}
}


// ==== Function Rendering ====
function drawFunctions() {
	const w = el.canvas.clientWidth;

	for (const f of state.functions) {
		if (!f.visible) {
			continue;
		}

		ctx.strokeStyle = f.color;
		ctx.lineWidth = 2.5;
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
		ymax: state.drag.worldStart.ymax + ddy,
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
}

window.addEventListener('load', init);