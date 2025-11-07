import { el } from '../core/state.js';
import { resizeCanvas } from '../graphics/canvas.js';

function initSidebarResize() {
	let dragging = false;
	let startX = 0;
	let startW = 0;

	const minSidebarW = 160;
	const minCanvasW = 320;

	el.resizer.addEventListener('mousedown', e => {
		dragging = true;
		startX = e.clientX;
		startW = el.sidebar.getBoundingClientRect().width;
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	});

	window.addEventListener('mousemove', e => {
		if (!dragging) {
			return;
		}

		const dx = e.clientX - startX;
		let w = startW + dx;

		const totalW = el.app.clientWidth;
		const maxSidebarW = totalW - minCanvasW;

		if (w < minSidebarW) {
			w = minSidebarW;
		}
		if (w > maxSidebarW) {
			w = maxSidebarW;
		}

		el.app.style.setProperty('--sidebar-w', w + 'px');
		resizeCanvas();
	});

	window.addEventListener('mouseup', () => {
		if (!dragging) {
			return;
		}
		dragging = false;
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	});
}

export { initSidebarResize };