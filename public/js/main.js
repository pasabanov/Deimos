import { initCanvas } from './graphics/canvas.js';
import { initSidebar } from './ui/sidebar.js';
import { initResizer } from './ui/resizer.js';

function init() {
	initCanvas();
	initSidebar();
	initResizer();
}

window.addEventListener('load', init);