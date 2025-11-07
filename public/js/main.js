import { initCanvas } from './graphics/canvas.js';
import { initSidebar } from './ui/sidebar.js';
import { initSidebarResize } from './ui/resizer.js';

function init() {
	initCanvas();
	initSidebar();
	initSidebarResize();
}

window.addEventListener('load', init);