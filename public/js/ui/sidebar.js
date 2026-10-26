import { state } from '../core/state.js';
import { el } from './el.js';
import { GraphItem } from '../core/items.js';
import { restoreDefaultWorld, zoomIn, zoomOut, requestDraw } from '../graphics/canvas.js';
import { compileLatex } from '../latex-compiler/index.js';
import { AUTO_COMMANDS_FOR_MATHQUILL, AUTO_OPERATOR_NAMES_FOR_MATHQUILL } from '../latex-compiler/datatypes.js';
import { numberToLatex, latexToNumber } from '../utils/latex-utils.js';
import { requestSeparateFrameOnce } from '../utils/scheduler.js';

const MQ = MathQuill.getInterface(2);

const MQ_BASE = {
	supSubsRequireOperand: true,
	charsThatBreakOutOfSupSub: '+-*=,;',
	autoSubscriptNumerals: true,
	autoCommands: AUTO_COMMANDS_FOR_MATHQUILL,
	autoOperatorNames: AUTO_OPERATOR_NAMES_FOR_MATHQUILL,
};

function addGraphItem(index = null) {
	if (index < 0 || index >= state.items.length) {
		index = null;
	}

	const id = crypto.randomUUID();
	const color = state.colors[state.colorIndex];
	state.colorIndex = (state.colorIndex + 1) % state.colors.length;

	const wrapper = document.createElement('div');
	wrapper.className = 'item';
	wrapper.dataset.id = id;

	const colorDot = document.createElement('div');
	colorDot.className = 'item-color';
	colorDot.style.background = color;

	const mqHost = document.createElement('div');
	mqHost.className = 'mq-host';

	const del = document.createElement('div');
	del.className = 'item-delete';

	wrapper.appendChild(colorDot);
	wrapper.appendChild(mqHost);
	wrapper.appendChild(del);

	let graphItem = new GraphItem(id, color, true, false, null, null, null, null);

	const mathField = MQ.MathField(mqHost, {
		...MQ_BASE,
		handlers: {
			edit: () => {
				let latex = mathField.latex();
				if (latex.includes('cbrt')) {
					mathField.keystroke('Backspace');
					mathField.keystroke('Backspace');
					mathField.keystroke('Backspace');
					mathField.keystroke('Backspace');
					mathField.write('\\sqrt[3]{}');
					mathField.keystroke('Left');
					latex = mathField.latex();
				}
				try {
					graphItem.mathExpression = compileLatex(latex);
				} catch {
					graphItem.mathExpression = null;
					if (graphItem.valuesBuffer) {
						graphItem.valuesBuffer.fill(NaN);
					}
					if (graphItem.implicitBuffers) {
						graphItem.implicitBuffers = null;
					}
				}
				requestDraw();
			},
			enter: () => {
				const idx = state.items.findIndex(x => x.id === id);
				addGraphItem(idx + 1);
				state.items[idx+1].mathField.focus();
			},
			moveOutOf: dir => {
				if (state.sidebar.moveOutOfFields) {
					if (dir === MQ.L) {
						const idx = state.items.findIndex(x => x.id === id);
						if (idx > 0) {
							state.items[idx-1].mathField.focus();
						}
					} else if (dir === MQ.R) {
						const idx = state.items.findIndex(x => x.id === id);
						if (idx !== -1 && idx + 1 < state.items.length) {
							state.items[idx+1].mathField.focus();
						}
					}
				}
			},
			deleteOutOf: dir => {
				if (dir === MQ.L && mathField.latex() === '') {
					const idx = state.items.findIndex(x => x.id === id);
					if (idx > 0) {
						state.items.splice(idx, 1);
						wrapper.remove();
						state.items[idx-1].mathField.focus();
					}
				}
			},
			upOutOf: () => {
				const idx = state.items.findIndex(x => x.id === id);
				if (idx > 0) {
					state.items[idx-1].mathField.focus();
				}
			},
			downOutOf: () => {
				const idx = state.items.findIndex(x => x.id === id);
				if (idx !== -1 && idx + 1 < state.items.length) {
					state.items[idx+1].mathField.focus();
				}
			},
		},
	});
	graphItem.mathField = mathField;

	mqHost.addEventListener('focusin', () => {
		graphItem.selected = true;
		requestDraw();
	});
	mqHost.addEventListener('focusout', () => {
		graphItem.selected = false;
	});

	if (index === null) {
		state.items.push(graphItem);
		el.itemList.appendChild(wrapper);
	} else {
		state.items.splice(index, 0, graphItem);
		el.itemList.children[index].before(wrapper);
	}

	colorDot.addEventListener('pointerdown', e => e.preventDefault());
	colorDot.addEventListener('click', () => {
		const off = colorDot.classList.toggle('off');
		if (off) {
			colorDot.style.background = 'none';
			colorDot.style.border = `4px solid ${color}`;
		} else {
			colorDot.style.background = color;
			colorDot.style.border = 'none';
		}
		graphItem.visible = !off;
		requestDraw();
	});

	del.addEventListener('pointerdown', e => e.preventDefault());
	del.addEventListener('click', () => {
		const idx = state.items.findIndex(x => x.id === id);
		if (idx >= 0) {
			state.items.splice(idx, 1);
			wrapper.remove();
			if (state.items.length === 0) {
				addGraphItem();
				state.items[0].mathField.focus();
			}
			requestDraw();
		}
	});

	if (!window.matchMedia('(orientation: portrait)').matches) {
		graphItem.mathField.focus();
	}
}

function initItems() {
	addGraphItem();
	el.itemAdd.addEventListener('click', () => addGraphItem());
}

const settings = {
	axisFields: {},
};

function initSettings() {
	for (const host of el.settings.querySelectorAll('[data-latex]')) {
		MQ.StaticMath(host).latex(host.dataset.latex);
	}

	const initAxisField = (mqHost, key, otherKey, cmp) => {
		const mathField = MQ.MathField(mqHost, {
			...MQ_BASE,
			handlers: {
				edit: () => {
					const n = latexToNumber(mathField.latex());
					if (Number.isFinite(n) && cmp(n, state.world[otherKey])) {
						state.world[key] = n;
						requestDraw();
					}
				},
			},
		});
		settings.axisFields[key] = mathField;
	};

	initAxisField(el.xMin, 'xmin', 'xmax', (a, b) => a < b);
	initAxisField(el.xMax, 'xmax', 'xmin', (a, b) => a > b);
	initAxisField(el.yMin, 'ymin', 'ymax', (a, b) => a < b);
	initAxisField(el.yMax, 'ymax', 'ymin', (a, b) => a > b);
}

function syncSettings() {
	if (state.sidebar.mode !== 'settings') {
		return;
	}
	for (const key in settings.axisFields) {
		settings.axisFields[key].latex(numberToLatex(state.world[key]));
	}
}

function requestSyncSettings() {
	requestSeparateFrameOnce(syncSettings);
}

function toggleSidebarMode() {
	if (state.sidebar.mode === 'items') {
		state.sidebar.mode = 'settings';
		el.items.hidden = true;
		el.settings.hidden = false;
		el.toggleSettings.title = 'Close Settings';
		el.toggleSettings.classList.toggle('active', true);
		el.toggleSettings.querySelector('iconify-icon').setAttribute('icon', 'lucide:x');
		syncSettings();
	} else {
		state.sidebar.mode = 'items';
		el.items.hidden = false;
		el.settings.hidden = true;
		el.toggleSettings.title = 'Settings';
		el.toggleSettings.classList.toggle('active', false);
		el.toggleSettings.querySelector('iconify-icon').setAttribute('icon', 'lucide:settings-2');
	}
}

function initSidebar() {
	initItems();
	initSettings();
	el.sidebar.addEventListener('pointerdown', requestDraw);
	el.zoomOut.addEventListener('click', zoomOut);
	el.zoomIn.addEventListener('click', zoomIn);
	el.resetWorld.addEventListener('click', restoreDefaultWorld);
	el.toggleSettings.addEventListener('click', toggleSidebarMode);
}

export { initSidebar, requestSyncSettings };