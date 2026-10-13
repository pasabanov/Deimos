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
	const s = state.world.xmax - state.world.xmin;
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

	if (
		!Number.isFinite(stepMajor) ||
		stepMajor <= 0 ||
		!Number.isFinite(stepMinor) ||
		stepMinor <= 0 ||
		!Number.isFinite(state.world.xmin) ||
		!Number.isFinite(state.world.xmax) ||
		!Number.isFinite(state.world.ymin) ||
		!Number.isFinite(state.world.ymax) ||
		!Number.isFinite(xStartMajor) ||
		!Number.isFinite(yStartMajor) ||
		!Number.isFinite(xStartMinor) ||
		!Number.isFinite(yStartMinor)
	) {
		return;
	}

	ctx.lineWidth = 1;
	ctx.strokeStyle = '#e0e0e0';

	for (let x = xStartMinor; x <= state.world.xmax + 1e-12; x += stepMinor) {
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

	for (let y = yStartMinor; y <= state.world.ymax + 1e-12; y += stepMinor) {
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

	for (let x = xStartMajor; x <= state.world.xmax + 1e-12; x += stepMajor) {
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

	for (let y = yStartMajor; y <= state.world.ymax + 1e-12; y += stepMajor) {
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

function drawFunctions() {
	const w = el.canvas.clientWidth;
	const h = el.canvas.clientHeight;

	const cropDistance = 1e9;

	for (const f of state.functions) {
		if (!f.visible) {
			continue;
		}
		ctx.strokeStyle = f.color;
		ctx.lineWidth = 2.5;

		if (f.selected) {
			ctx.lineWidth += 1;
		}

		ctx.beginPath();

		const samples = Math.max(400, w);
		for (let i = 0; i <= samples; ++i) {
			const sx = w * i / samples;
			const x = screenToWorldX(sx);

			let y;
			try {
				y = f.fn(x);
			} catch (e) {
				y = NaN;
			}

			const sy = worldToScreenY(y);

			if (!Number.isFinite(sy) || sy < -cropDistance * h || sy > (cropDistance + 1) * h) {
				ctx.stroke();
				ctx.beginPath();
				continue;
			}

			ctx.lineTo(sx, sy);
		}

		ctx.stroke();
	}
}

function draw() {
	drawGrid();
	drawFunctions();
	el.ranges.textContent = `x: [${round(state.world.xmin)}, ${round(state.world.xmax)}]  y: [${round(state.world.ymin)}, ${round(state.world.ymax)}]`;
}

function onWheel(e) {
	e.preventDefault();
	if (state.drag.active) {
		onPointerMove(e);
	}
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
	if (state.drag.active) {
		onPointerDown(e);
	}
	draw();
}

function onPointerDown(e) {
	el.canvas.setPointerCapture(e.pointerId);
	state.drag.active = true;
	state.drag.x = e.clientX;
	state.drag.y = e.clientY;
	state.drag.worldStart = { ...state.world };
	requestAnimationFrame(draw);
}

function onPointerMove(e) {
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

function onUpOrCancel() {
	state.drag.active = false;
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