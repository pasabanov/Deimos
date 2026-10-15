import { state, el, CURVE_TYPE, CurveItem } from '../core/state.js';

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
	requestAnimationFrame(draw);
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

function computeExplicitCurveScreenValues(curveItem, independentPixels, visibleSamples, samples, cropMin, cropMax, orientation) {
	if (!curveItem.valuesBuffer || curveItem.valuesBuffer.length < samples) {
		curveItem.valuesBuffer = new Float64Array(samples);
	}

	for (let i = 0; i < samples; ++i) {
		const sampleScreen = independentPixels * (i - state.preSamples) / visibleSamples;
		const independent = orientation === 'x' ? screenToWorldX(sampleScreen) : screenToWorldY(sampleScreen);

		let dependent;
		try {
			dependent = curveItem.curve.fn(independent);
		} catch {
			if (state.returnOnEvalError) {
				return;
			}
			dependent = NaN;
		}

		let screenValue = orientation === 'x' ? worldToScreenY(dependent) : worldToScreenX(dependent);
		if (screenValue < cropMin) {
			screenValue = -Infinity;
		} else if (screenValue > cropMax) {
			screenValue = Infinity;
		}

		curveItem.valuesBuffer[i] = screenValue;
	}
}

function drawExplicitCurve(curveItem) {
	const w = el.canvas.clientWidth;
	const h = el.canvas.clientHeight;

	const orientation = curveItem.curve.dependent === 'y' ? 'x' : 'y';

	const independentPixels = orientation === 'x' ? w : h;
	const dependentPixels = orientation === 'x' ? h : w;

	const visibleSamples = state.samplesPerPixel * independentPixels;
	const samples = visibleSamples + state.preSamples + state.postSamples;

	const trustedMin = -state.trustedDistance * dependentPixels;
	const trustedMax = (state.trustedDistance + 1) * dependentPixels;

	computeExplicitCurveScreenValues(curveItem, independentPixels, visibleSamples, samples, -state.cropDistance * dependentPixels, (state.cropDistance + 1) * dependentPixels, orientation);

	ctx.strokeStyle = curveItem.color;
	ctx.lineWidth = curveItem.selected ? 3.5 : 2.5;

	ctx.beginPath();
	let drawing = false;
	for (let i = state.preSamples; i < visibleSamples + state.preSamples; ++i) {
		const sampleScreen = independentPixels * (i - state.preSamples) / visibleSamples;
		const valueScreen = curveItem.valuesBuffer[i];

		if (!Number.isFinite(valueScreen)) {
			drawing = false;
			continue;
		}

		if (state.preSamples > 1 && state.postSamples > 0) {
			for (const direction of [-1, 1]) {
				let monotonic = true;
				for (let j = 1; j < state.preSamples && monotonic; ++j) {
					monotonic = direction * (curveItem.valuesBuffer[i-j-1] - curveItem.valuesBuffer[i-j]) > 0;
				}
				for (let j = 0; j < state.postSamples && monotonic; ++j) {
					monotonic = direction * (curveItem.valuesBuffer[i+j] - curveItem.valuesBuffer[i+j+1]) > 0;
				}
				if (monotonic
					&& (direction > 0
						? curveItem.valuesBuffer[i-1] < trustedMin && trustedMax < valueScreen
						: curveItem.valuesBuffer[i-1] > trustedMax && trustedMin > valueScreen
					)
				) {
					drawing = false;
					break;
				}
			}
		}

		const [sx, sy] = orientation === 'x' ? [sampleScreen, valueScreen] : [valueScreen, sampleScreen];

		if (drawing) {
			ctx.lineTo(sx, sy);
		} else {
			ctx.moveTo(sx, sy);
			drawing = true;
		}
	}
	ctx.stroke();
}

function drawImplicitCurve(curveItem) {
	const w = el.canvas.clientWidth;
	const h = el.canvas.clientHeight;

	const columns = 1 + Math.ceil(w / state.marchingSquaresStep);
	const rows = 1 + Math.ceil(h / state.marchingSquaresStep);

	const screenXs = new Float64Array(columns);
	const screenYs = new Float64Array(rows);
	const betweenScreenXs = new Float64Array(columns - 1);
	const betweenScreenYs = new Float64Array(rows - 1);
	const worldXs = new Float64Array(columns);
	const worldYs = new Float64Array(rows);
	const betweenWorldXs = new Float64Array(columns - 1);
	const betweenWorldYs = new Float64Array(rows - 1);
	const values = new Float64Array(columns * rows);
	const betweenXValues = new Float64Array((columns - 1) * rows);
	const betweenYValues = new Float64Array(columns * (rows - 1));

	for (let i = 0; i < columns; ++i) {
		screenXs[i] = Math.min(i * state.marchingSquaresStep, w);
		worldXs[i] = screenToWorldX(screenXs[i]);
	}
	for (let j = 0; j < rows; ++j) {
		screenYs[j] = Math.min(j * state.marchingSquaresStep, h);
		worldYs[j] = screenToWorldY(screenYs[j]);
	}

	for (let i = 0; i < columns - 1; ++i) {
		betweenScreenXs[i] = (screenXs[i] + screenXs[i+1]) / 2;
		betweenWorldXs[i] = screenToWorldX(betweenScreenXs[i]);
	}
	for (let j = 0; j < rows - 1; ++j) {
		betweenScreenYs[j] = (screenYs[j] + screenYs[j+1]) / 2;
		betweenWorldYs[j] = screenToWorldY(betweenScreenYs[j]);
	}

	for (let j = 0; j < rows; ++j) {
		const offset = j * columns;
		const worldY = worldYs[j];

		for (let i = 0; i < columns; ++i) {
			try {
				values[offset+i] = curveItem.curve.fn(worldXs[i], worldY);
			} catch {
				if (state.returnOnEvalError) {
					return;
				}
				values[offset+i] = NaN;
			}
		}
	}

	// horizontal edges
	for (let j = 0; j < rows; ++j) {
		const row = j * columns;
		const offset = j * (columns - 1);
		const worldY = worldYs[j];
		for (let i = 0; i < columns - 1; ++i) {
			if (Number.isFinite(values[row+i]) && Number.isFinite(values[row+i+1]) && (values[row+i] < 0) !== (values[row+i+1] < 0)) {
				try {
					betweenXValues[offset+i] = curveItem.curve.fn(betweenWorldXs[i], worldY);
				} catch {
					if (state.returnOnEvalError) {
						return;
					}
				}
			}
		}
	}
	// vertical edges
	for (let j = 0; j < rows - 1; ++j) {
		const row0 = j * columns;
		const row1 = row0 + columns;
		const offset = j * columns;
		const worldY = betweenWorldYs[j];
		for (let i = 0; i < columns; ++i) {
			if (Number.isFinite(values[row0+i]) && Number.isFinite(values[row1+i]) && (values[row0+i] < 0) !== (values[row1+i] < 0)) {
				try {
					betweenYValues[offset+i] = curveItem.curve.fn(worldXs[i], worldY);
				} catch {
					if (state.returnOnEvalError) {
						return;
					}
				}
			}
		}
	}

	ctx.strokeStyle = curveItem.color;
	ctx.lineWidth = curveItem.selected ? 3.5 : 2.5;

	ctx.beginPath();

	// reuse buffers in all cells
	const ix = new Float64Array(4);
	const iy = new Float64Array(4);

	for (let j = 0; j < rows - 1; ++j) {
		const y0 = screenYs[j];
		const y1 = screenYs[j+1];
		const row0 = j * columns;
		const row1 = row0 + columns;

		for (let i = 0; i < columns - 1; ++i) {
			const x0 = screenXs[i];
			const x1 = screenXs[i+1];

			// vertices: top left, top right, bottom right, bottom left
			const v0 = values[row0+i];
			const v1 = values[row0+i+1];
			const v2 = values[row1+i+1];
			const v3 = values[row1+i];

			// values at the midpoints of the edges: top, right, bottom, left
			const e0 = betweenXValues[row0-j+i];
			const e1 = betweenYValues[row0+i+1];
			const e2 = betweenXValues[row1-j+i-1];
			const e3 = betweenYValues[row0+i];

			let count = 0;

			// top edge: 0 -> 1
			if (Number.isFinite(v0) && Number.isFinite(v1) && (v0 < 0) !== (v1 < 0) && Number.isFinite(e0) && (v0 < e0) === (e0 < v1)) {
				ix[count] = x0 + v0 * (x1 - x0) / (v0 - v1);
				iy[count++] = y0;
			}
			// right edge: 1 -> 2
			if (Number.isFinite(v1) && Number.isFinite(v2) && (v1 < 0) !== (v2 < 0) && Number.isFinite(e1) && (v1 < e1) === (e1 < v2)) {
				ix[count] = x1;
				iy[count++] = y0 + v1 * (y1 - y0) / (v1 - v2);
			}
			// bottom edge: 2 -> 3
			if (Number.isFinite(v2) && Number.isFinite(v3) && (v2 < 0) !== (v3 < 0) && Number.isFinite(e2) && (v2 < e2) === (e2 < v3)) {
				ix[count] = x1 + v2 * (x0 - x1) / (v2 - v3);
				iy[count++] = y1;
			}
			// left edge: 3 -> 0
			if (Number.isFinite(v3) && Number.isFinite(v0) && (v3 < 0) !== (v0 < 0) && Number.isFinite(e3) && (v3 < e3) === (e3 < v0)) {
				ix[count] = x0;
				iy[count++] = y1 + v3 * (y0 - y1) / (v3 - v0);
			}

			if (count === 2) {
				ctx.moveTo(ix[0], iy[0]);
				ctx.lineTo(ix[1], iy[1]);
			} else if (count === 4) {
				// additional calculation required in an ambiguous case
				let center;

				try {
					center = curveItem.curve.fn((worldXs[i] + worldXs[i+1]) / 2, (worldYs[j] + worldYs[j+1]) / 2);
				} catch {
					if (state.returnOnEvalError) {
						return;
					}
					center = NaN;
				}

				if (Number.isFinite(center)) {
					if ((v0 >= 0) === (center >= 0)) {
						ctx.moveTo(ix[0], iy[0]);
						ctx.lineTo(ix[1], iy[1]);

						ctx.moveTo(ix[2], iy[2]);
						ctx.lineTo(ix[3], iy[3]);
					} else {
						ctx.moveTo(ix[0], iy[0]);
						ctx.lineTo(ix[3], iy[3]);

						ctx.moveTo(ix[1], iy[1]);
						ctx.lineTo(ix[2], iy[2]);
					}
				}
			}
		}
	}

	ctx.stroke();
}

function computeSingleVariableEquationValues(curveItem, independentPixels, visibleSamples, samples, orientation) {
	if (!curveItem.valuesBuffer || curveItem.valuesBuffer.length < samples) {
		curveItem.valuesBuffer = new Float64Array(samples);
	}
	for (let i = 0; i < samples; ++i) {
		const sampleScreen = independentPixels * (i - state.preSamples) / visibleSamples;
		const variable = orientation === 'x' ? screenToWorldX(sampleScreen) : screenToWorldY(sampleScreen);
		try {
			curveItem.valuesBuffer[i] = curveItem.curve.fn(variable);
		} catch {
			if (state.returnOnEvalError) {
				return;
			}
			curveItem.valuesBuffer[i] = NaN;
		}
	}
}

function drawSingleVariableEquation(curveItem) {
	const w = el.canvas.clientWidth;
	const h = el.canvas.clientHeight;

	const orientation = curveItem.curve.dependent === 'x' ? 'x' : 'y';

	const independentPixels = orientation === 'x' ? w : h;

	const visibleSamples = state.samplesPerPixel * independentPixels;
	const samples = visibleSamples + state.preSamples + state.postSamples;

	computeSingleVariableEquationValues(curveItem, independentPixels, visibleSamples, samples, orientation);

	ctx.strokeStyle = curveItem.color;
	ctx.lineWidth = curveItem.selected ? 3.5 : 2.5;

	ctx.beginPath();
	for (let i = state.preSamples; i < visibleSamples + state.preSamples; ++i) {
		const sampleScreen = independentPixels * (i - state.preSamples) / visibleSamples;
		const prevValue = curveItem.valuesBuffer[i-1];
		const curValue = curveItem.valuesBuffer[i];
		const nextValue = curveItem.valuesBuffer[i+1];

		if (!Number.isFinite(prevValue) || !Number.isFinite(curValue) || !Number.isFinite(nextValue)) {
			continue;
		}

		if ((prevValue < 0) !== (nextValue < 0) && (prevValue < curValue) === (curValue < nextValue)) {
			const [startX, startY] = orientation === 'x' ? [sampleScreen, 0] : [0, sampleScreen];
			const [endX, endY] = orientation === 'x' ? [sampleScreen, h] : [w, sampleScreen];
			ctx.moveTo(startX, startY);
			ctx.lineTo(endX, endY);
		}
	}
	ctx.stroke();
}

function drawCurve(curveItem) {
	switch (curveItem.curve.type) {
		case CURVE_TYPE.EXPLICIT: {
			drawExplicitCurve(curveItem);
			break;
		}
		case CURVE_TYPE.IMPLICIT: {
			drawImplicitCurve(curveItem);
			break;
		}
		case CURVE_TYPE.SINGLE_VARIABLE_EQUATION: {
			drawSingleVariableEquation(curveItem);
			break;
		}
		default:
			throw new Error(`Unexpected curve type: ${curveItem.curve.type}`);
	}
}

function drawCurves() {
	let selectedCurveItem = null;

	for (const item of state.items) {
		if (!(item instanceof CurveItem)) {
			continue;
		}
		const curveItem = item;
		if (!curveItem.visible || !curveItem.curve) {
			continue;
		}
		if (curveItem.selected) {
			selectedCurveItem = curveItem;
			continue;
		}
		drawCurve(curveItem);
	}

	if (selectedCurveItem) {
		drawCurve(selectedCurveItem);
	}
}

function draw() {
	drawGrid();
	drawCurves();
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