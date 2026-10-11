import { el } from '../core/state.js';
import { resizeCanvas } from '../graphics/canvas.js';

function initResizer() {
	let dragging = false;
	let startPos = 0;
	let startSize = 0;

	const minSidebarSize = 175;
	const minPlotSize = 175;
	const resizerSize = 1;

	el.resizer.addEventListener('pointerdown', e => {
		dragging = true;
		el.resizer.setPointerCapture(e.pointerId);
		if (window.matchMedia('(orientation: portrait)').matches) {
			startPos = e.clientY;
			startSize = el.sidebar.getBoundingClientRect().height;
		} else {
			startPos = e.clientX;
			startSize = el.sidebar.getBoundingClientRect().width;
		}
		document.body.style.userSelect = 'none';
	});

	window.addEventListener('pointermove', e => {
		if (!dragging) {
			return;
		}

		const portrait = window.matchMedia('(orientation: portrait)');

		const pos = portrait.matches ? e.clientY : e.clientX;
		const delta = pos - startPos;
		const totalSize = portrait.matches ? el.app.clientHeight : el.app.clientWidth;

		const maxSidebarSize = totalSize - minPlotSize - resizerSize;
		const size = Math.max(
			minSidebarSize,
			Math.min(maxSidebarSize, startSize + (portrait.matches ? -delta : delta)),
		);

		el.app.style.setProperty(portrait.matches ? '--sidebar-height' : '--sidebar-width', `${size}px`);

		resizeCanvas();
	});

	el.resizer.addEventListener('pointerup', () => dragging = false);
	el.resizer.addEventListener('pointercancel', () => dragging = false);
}

export { initResizer };