import { state, el } from '../core/state.js';

const ctx = el.canvas.getContext('2d');

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
	const dpr = window.devicePixelRatio ?? 1;
	const rect = el.canvas.getBoundingClientRect();
	el.canvas.width = Math.floor(rect.width * dpr);
	el.canvas.height = Math.floor(rect.height * dpr);
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	reflowWorldToCanvas();
	draw();
}

window.addEventListener('resize', resizeCanvas);

function worldToScreenX(x) {
	const sx = (x - state.world.xmin) * (el.canvas.clientWidth / (state.world.xmax - state.world.xmin));
	return sx;
}

function worldToScreenY(y) {
	const sy = el.canvas.clientHeight - (y - state.world.ymin) * (el.canvas.clientHeight / (state.world.ymax - state.world.ymin));
	return sy ;
}

function worldToScreen(x, y) {
	return { x: worldToScreenX(x), y: worldToScreenY(y) };
}

function screenToWorldX(sx) {
	const x = state.world.xmin + (sx * (state.world.xmax - state.world.xmin)) / el.canvas.clientWidth;
	return x;
}

function screenToWorldY(sy) {
	const y = state.world.ymin + ((el.canvas.clientHeight - sy) * (state.world.ymax - state.world.ymin)) / el.canvas.clientHeight;
	return y;
}

function screenToWorld(sx, sy) {
	return { x: screenToWorldX(sx), y: screenToWorldY(sy) };
}

function computeGridStep(ppu) {
	const targetPx = 70;
	const raw = targetPx / ppu;
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

function formatBoundary(v) {
	const s = state.world.xmax - state.world.xmin;
	const d = Math.max(0, 2 - Math.floor(Math.log10(Math.max(1e-9, s))));
	return Number(v.toFixed(d));
}

function formatTick(v, step) {
	const mag = Math.max(0, -Math.floor(Math.log10(step)));
	const s = v.toFixed(Math.min(10, mag));
	if (s.indexOf('.') < 0) {
		return s;
	}
	return s.replace(/\.?0+$/, '');
}

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
	const epsilon = 1e-9 * stepMinor;

	const xStartMajor = Math.ceil(state.world.xmin / stepMajor) * stepMajor;
	const yStartMajor = Math.ceil(state.world.ymin / stepMajor) * stepMajor;

	const xStartMinor = Math.ceil(state.world.xmin / stepMinor) * stepMinor;
	const yStartMinor = Math.ceil(state.world.ymin / stepMinor) * stepMinor;

	const loopLimit = 1000;

	ctx.lineWidth = 1;
	ctx.strokeStyle = '#e0e0e0';

	for (let x = xStartMinor, loop = 0; x <= state.world.xmax + epsilon && loop < loopLimit; x += stepMinor, ++loop) {
		const k = Math.round((x - xStartMajor) / stepMajor);
		const isMajorAligned = Math.abs(x - (xStartMajor + k * stepMajor)) <= stepMinor * 0.5e-3;
		if (isMajorAligned) {
			continue;
		}
		const p1 = worldToScreen(x, state.world.ymin);
		const p2 = worldToScreen(x, state.world.ymax);
		ctx.beginPath();
		ctx.moveTo(Math.round(p1.x) + 0.5, p1.y);
		ctx.lineTo(Math.round(p2.x) + 0.5, p2.y);
		ctx.stroke();
	}

	for (let y = yStartMinor, loop = 0; y <= state.world.ymax + epsilon && loop < loopLimit; y += stepMinor, ++loop) {
		const k = Math.round((y - yStartMajor) / stepMajor);
		const isMajorAligned = Math.abs(y - (yStartMajor + k * stepMajor)) <= stepMinor * 0.5e-3;
		if (isMajorAligned) {
			continue;
		}
		const p1 = worldToScreen(state.world.xmin, y);
		const p2 = worldToScreen(state.world.xmax, y);
		ctx.beginPath();
		ctx.moveTo(p1.x, Math.round(p1.y) + 0.5);
		ctx.lineTo(p2.x, Math.round(p2.y) + 0.5);
		ctx.stroke();
	}

	ctx.strokeStyle = '#999';

	for (let x = xStartMajor, loop = 0; x <= state.world.xmax + epsilon && loop < loopLimit; x += stepMajor, ++loop) {
		const p1 = worldToScreen(x, state.world.ymin);
		const p2 = worldToScreen(x, state.world.ymax);
		ctx.beginPath();
		ctx.moveTo(Math.round(p1.x) + 0.5, p1.y);
		ctx.lineTo(Math.round(p2.x) + 0.5, p2.y);
		ctx.stroke();
	}

	for (let y = yStartMajor, loop = 0; y <= state.world.ymax + epsilon && loop < loopLimit; y += stepMajor, ++loop) {
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

	const greyYLineX = Math.round(ox) - 0.5;
	if (greyYLineX >= 0 && greyYLineX <= w) {
		ctx.beginPath();
		ctx.moveTo(greyYLineX, 0);
		ctx.lineTo(greyYLineX, h);
		ctx.stroke();
	}
	const greyXLineY = Math.round(oy) + 0.5;
	if (greyXLineY >= 0 && greyXLineY <= h) {
		ctx.beginPath();
		ctx.moveTo(0, greyXLineY);
		ctx.lineTo(w, greyXLineY);
		ctx.stroke();
	}

	ctx.strokeStyle = '#111';

	const blackYLineX = Math.round(ox) + 0.5;
	if (blackYLineX >= 0 && blackYLineX <= w) {
		ctx.beginPath();
		ctx.moveTo(blackYLineX, 0);
		ctx.lineTo(blackYLineX, h);
		ctx.stroke();
	}
	const blackXLineY = Math.round(oy) - 0.5;
	if (blackXLineY >= 0 && blackXLineY <= h) {
		ctx.beginPath();
		ctx.moveTo(0, blackXLineY);
		ctx.lineTo(w, blackXLineY);
		ctx.stroke();
	}

	ctx.fillStyle = '#111';
	ctx.strokeStyle = '#fff';
	ctx.lineWidth = 4;
	ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif';
	ctx.textBaseline = 'top';
	ctx.textAlign = 'center';

	const xTickPadding = 6;

	for (let x = xStartMajor, loop = 0; x <= state.world.xmax + epsilon && loop < loopLimit; x += stepMajor, ++loop) {
		if (Math.abs(x) < stepMajor * 1e-9) {
			continue;
		}
		const p = worldToScreen(x, 0);
		const label = formatTick(x, stepMajor);
		let drawX = Math.round(p.x);
		if (label[0] === '-') {
			drawX -= ctx.measureText('-').width / 2;
		}
		const metrics = ctx.measureText(label);
		const left = drawX - metrics.actualBoundingBoxLeft;
		const right = drawX + metrics.actualBoundingBoxRight;
		if (left < 0 || right > w) {
			continue;
		}
		let yAxisScreen = oy - metrics.actualBoundingBoxAscent + xTickPadding;
		if (yAxisScreen < xTickPadding) {
			yAxisScreen = xTickPadding;
		} else if (yAxisScreen > h - metrics.actualBoundingBoxDescent - xTickPadding) {
			yAxisScreen = h - metrics.actualBoundingBoxDescent - xTickPadding;
		}
		ctx.strokeText(label, drawX, yAxisScreen);
		ctx.fillText(label, drawX, yAxisScreen);
	}

	ctx.textAlign = 'right';
	ctx.textBaseline = 'middle';

	const yTickPadding = 3;

	for (let y = yStartMajor, loop = 0; y <= state.world.ymax + epsilon && loop < loopLimit; y += stepMajor, ++loop) {
		if (Math.abs(y) < stepMajor * 1e-9) {
			continue;
		}
		const p = worldToScreen(0, y);
		const label = formatTick(y, stepMajor);
		const drawY = Math.round(p.y) + 0.5;
		const metrics = ctx.measureText(label);
		const top = drawY - (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / 2;
		const bottom = drawY + (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / 2;
		if (top < 0 || bottom > h) {
			continue;
		}
		let xAxisScreen = ox - yTickPadding;
		if (xAxisScreen < metrics.actualBoundingBoxLeft + yTickPadding) {
			xAxisScreen = metrics.actualBoundingBoxLeft + yTickPadding;
		} else if (xAxisScreen > w - yTickPadding) {
			xAxisScreen = w - yTickPadding;
		}
		ctx.strokeText(label, xAxisScreen, drawY);
		ctx.fillText(label, xAxisScreen, drawY);
	}
}

function computeFunctionScreenValues(f, w, samples, visibleSamples, preSamples, cropTop, cropBottom) {
	if (!f.screenValues || f.screenValues.length < samples) {
		f.screenValues = new Float64Array(samples);
	}

	for (let i = 0; i < samples; ++i) {
		const sx = w * (i - preSamples) / visibleSamples;
		const x = screenToWorldX(sx);

		let y;
		try {
			y = f.fn(x);
		} catch {
			y = NaN;
		}

		let sy = worldToScreenY(y);
		if (sy < cropTop) {
			sy = -Infinity;
		} else if (sy > cropBottom) {
			sy = Infinity;
		}

		f.screenValues[i] = sy;
	}
}

function drawFunction(f, w, visibleSamples, preSamples, trustedTop, trustedBottom) {
	ctx.strokeStyle = f.color;
	ctx.lineWidth = f.selected ? 3.5 : 2.5;

	ctx.beginPath();
	let drawing = false;
	for (let i = preSamples; i < visibleSamples + preSamples; ++i) {
		const sx = w * (i - preSamples) / visibleSamples;
		const sy = f.screenValues[i];

		if (!Number.isFinite(sy)) {
			drawing = false;
			continue;
		}

		const prevPrev = f.screenValues[i-2];
		const prev = f.screenValues[i-1];
		const next = f.screenValues[i+1];

		if (prevPrev > prev && prev < trustedTop && trustedBottom < sy && sy > next) {
			drawing = false;
			continue;
		}
		if (prevPrev < prev && prev > trustedBottom && trustedTop > sy && sy < next) {
			drawing = false;
			continue;
		}

		if (drawing) {
			ctx.lineTo(sx, sy);
		} else {
			ctx.moveTo(sx, sy);
			drawing = true;
		}
	}
	ctx.stroke();
}

function drawFunctions() {
	const w = el.canvas.clientWidth;
	const h = el.canvas.clientHeight;

	const visibleSamples = state.config.samplesPerPixel * w;
	const samples = visibleSamples + state.config.preSamples + state.config.postSamples;

	const cropTop = -state.config.cropDistance * h;
	const cropBottom = (state.config.cropDistance + 1) * h;

	const trustedTop = -state.config.trustedDistance * h;
	const trustedBottom = (state.config.trustedDistance + 1) * h;

	for (const f of state.functions) {
		if (!f.visible) {
			continue;
		}
		computeFunctionScreenValues(f, w, samples, visibleSamples, state.config.preSamples, cropTop, cropBottom);
	}

	let selectedIndex = -1;

	for (let i = 0; i < state.functions.length; ++i) {
		const f = state.functions[i];
		if (!f.visible) {
			continue;
		}
		if (f.selected) {
			selectedIndex = i;
			continue;
		}
		drawFunction(f, w, visibleSamples, state.config.preSamples, trustedTop, trustedBottom);
	}

	if (selectedIndex !== -1) {
		drawFunction(state.functions[selectedIndex], w, visibleSamples, state.config.preSamples, trustedTop, trustedBottom);
	}
}

function draw() {
	drawGrid();
	drawFunctions();
	el.ranges.textContent = `x: [${formatBoundary(state.world.xmin)}, ${formatBoundary(state.world.xmax)}]  y: [${formatBoundary(state.world.ymin)}, ${formatBoundary(state.world.ymax)}]`;
}

function handleZoom(clientX, clientY, delta) {
	const rect = el.canvas.getBoundingClientRect();
	const sx = clientX - rect.left;
	const sy = clientY - rect.top;
	const p = screenToWorld(sx, sy);
	const scale = delta < 0 ? 1 / 1.1 : 1.1;

	state.world.xmin = p.x + (state.world.xmin - p.x) * scale;
	state.world.xmax = p.x + (state.world.xmax - p.x) * scale;
	state.world.ymin = p.y + (state.world.ymin - p.y) * scale;
	state.world.ymax = p.y + (state.world.ymax - p.y) * scale;
}

function handleDragInit(clientX, clientY) {
	state.drag.active = true;
	state.drag.x = clientX;
	state.drag.y = clientY;
	state.drag.worldStart.xmin = state.world.xmin;
	state.drag.worldStart.xmax = state.world.xmax;
	state.drag.worldStart.ymin = state.world.ymin;
	state.drag.worldStart.ymax = state.world.ymax;
}

function handleDrag(clientX, clientY) {
	if (!state.drag.active) {
		return;
	}
	const dx = clientX - state.drag.x;
	const dy = clientY - state.drag.y;
	const p1 = screenToWorld(0, 0);
	const p2 = screenToWorld(dx, dy);
	const ddx = p1.x - p2.x;
	const ddy = p1.y - p2.y;

	state.world.xmin = state.drag.worldStart.xmin + ddx;
	state.world.xmax = state.drag.worldStart.xmax + ddx;
	state.world.ymin = state.drag.worldStart.ymin + ddy;
	state.world.ymax = state.drag.worldStart.ymax + ddy;
}

function handlePinchInit() {
	const rect = el.canvas.getBoundingClientRect();
	const dx = state.pinch.pointer2.x - state.pinch.pointer1.x;
	const dy = state.pinch.pointer2.y - state.pinch.pointer1.y;
	const startMidX = (state.pinch.pointer1.x + state.pinch.pointer2.x) / 2;
	const startMidY = (state.pinch.pointer1.y + state.pinch.pointer2.y) / 2;
	const p = screenToWorld(startMidX - rect.left, startMidY - rect.top);

	state.drag.active = false;

	state.pinch.active = true;
	state.pinch.startDistance = Math.hypot(dx, dy);
	state.pinch.worldStart.xmin = state.world.xmin;
	state.pinch.worldStart.xmax = state.world.xmax;
	state.pinch.worldStart.ymin = state.world.ymin;
	state.pinch.worldStart.ymax = state.world.ymax;
	state.pinch.anchorX = p.x;
	state.pinch.anchorY = p.y;
}

function handlePinch() {
	const rect = el.canvas.getBoundingClientRect();
	if (rect.width === 0 || rect.height === 0) {
		return;
	}

	const dx = state.pinch.pointer2.x - state.pinch.pointer1.x;
	const dy = state.pinch.pointer2.y - state.pinch.pointer1.y;
	const distance = Math.hypot(dx, dy);

	if (distance === 0 || state.pinch.startDistance === 0) {
		return;
	}

	const scale = state.pinch.startDistance / distance;
	const midX = (state.pinch.pointer1.x + state.pinch.pointer2.x) / 2 - rect.left;
	const midY = (state.pinch.pointer1.y + state.pinch.pointer2.y) / 2 - rect.top;

	const worldWidth = (state.pinch.worldStart.xmax - state.pinch.worldStart.xmin) * scale;
	const worldHeight = (state.pinch.worldStart.ymax - state.pinch.worldStart.ymin) * scale;

	state.world.xmin = state.pinch.anchorX - midX / rect.width * worldWidth;
	state.world.xmax = state.world.xmin + worldWidth;
	state.world.ymax = state.pinch.anchorY + midY / rect.height * worldHeight;
	state.world.ymin = state.world.ymax - worldHeight;
}

function onWheel(e) {
	e.preventDefault();
	if (state.pinch.active) {
		return;
	}
	if (state.drag.active) {
		handleDrag(e.clientX, e.clientY);
	}
	handleZoom(e.clientX, e.clientY, e.deltaY);
	if (state.drag.active) {
		handleDragInit(e.clientX, e.clientY);
	}
	requestAnimationFrame(draw);
}

function onPointerDown(e) {
	el.canvas.setPointerCapture(e.pointerId);
	if (state.pinch.active) {
		return;
	}
	if (state.pinch.pointer1.id === -1) {
		state.pinch.pointer1.id = e.pointerId;
		state.pinch.pointer1.x = e.clientX;
		state.pinch.pointer1.y = e.clientY;
		handleDragInit(e.clientX, e.clientY);
	} else {
		if (e.pointerId === state.pinch.pointer1.id || state.pinch.pointer2.id !== -1) {
			return;
		}
		state.pinch.pointer2.id = e.pointerId;
		state.pinch.pointer2.x = e.clientX;
		state.pinch.pointer2.y = e.clientY;
		handlePinchInit();
	}
	requestAnimationFrame(draw);
}

function onPointerMove(e) {
	if (e.pointerId === state.pinch.pointer1.id) {
		state.pinch.pointer1.x = e.clientX;
		state.pinch.pointer1.y = e.clientY;
	} else if (e.pointerId === state.pinch.pointer2.id) {
		state.pinch.pointer2.x = e.clientX;
		state.pinch.pointer2.y = e.clientY;
	} else {
		return;
	}
	if (state.pinch.active) {
		handlePinch();
	} else {
		handleDrag(e.clientX, e.clientY);
	}
	requestAnimationFrame(draw);
}

function onUpOrCancel(e) {
	if (state.pinch.active) {
		if (e.pointerId !== state.pinch.pointer1.id && e.pointerId !== state.pinch.pointer2.id) {
			return;
		}
		if (e.pointerId === state.pinch.pointer1.id) {
			state.pinch.pointer1.id = state.pinch.pointer2.id;
			state.pinch.pointer1.x = state.pinch.pointer2.x;
			state.pinch.pointer1.y = state.pinch.pointer2.y;
		}
		state.pinch.active = false;
		state.pinch.pointer2.id = -1;
		state.pinch.pointer2.x = NaN;
		state.pinch.pointer2.y = NaN;
		handleDragInit(state.pinch.pointer1.x, state.pinch.pointer1.y);
		requestAnimationFrame(draw);
		return;
	}
	if (e.pointerId === state.pinch.pointer1.id) {
		state.drag.active = false;
		state.pinch.pointer1.id = -1;
		state.pinch.pointer1.x = NaN;
		state.pinch.pointer1.y = NaN;
	}
}

function initCanvas() {
	resizeCanvas();
	el.canvas.addEventListener('wheel', onWheel, { passive: false });
	el.canvas.addEventListener('pointerdown', onPointerDown);
	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('pointerup', onUpOrCancel);
	window.addEventListener('pointercancel', onUpOrCancel);
}

export { initCanvas, resizeCanvas, draw };