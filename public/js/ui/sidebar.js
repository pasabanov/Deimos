import { state } from '../core/state.js';
import { el } from './el.js';
import { GraphItem } from '../core/items.js';
import { draw } from '../graphics/canvas.js';
import { compileLatex } from '../latex-compiler/index.js';
import { AUTO_COMMANDS_FOR_MATHQUILL, AUTO_OPERATOR_NAMES_FOR_MATHQUILL } from '../latex-compiler/datatypes.js';

const MQ = window.MathQuill.getInterface(2);

function addGraphItem() {
	const id = crypto.randomUUID();
	const color = state.colors[state.colorIndex];
	state.colorIndex = (state.colorIndex + 1) % state.colors.length;

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

	let graphItem = new GraphItem(id, color, true, false, null, null, null, null);

	const field = MQ.MathField(mqHost, {
		supSubsRequireOperand: true,
		charsThatBreakOutOfSupSub: '+-*=,;',
		autoSubscriptNumerals: true,
		autoCommands: AUTO_COMMANDS_FOR_MATHQUILL,
		autoOperatorNames: AUTO_OPERATOR_NAMES_FOR_MATHQUILL,
		handlers: {
			edit: () => {
				let latex = field.latex();
				if (latex.includes('cbrt')) {
					field.keystroke('Backspace');
					field.keystroke('Backspace');
					field.keystroke('Backspace');
					field.keystroke('Backspace');
					field.write('\\sqrt[3]{}');
					field.keystroke('Left');
					latex = field.latex();
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
				requestAnimationFrame(draw);
			},
			enter: () => {
				addGraphItem();
				const idx = state.items.findIndex(x => x.id === id);
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
				if (dir === MQ.L) {
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
	graphItem.mathField = field;

	mqHost.addEventListener('focusin', () => {
		graphItem.selected = true;
		requestAnimationFrame(draw);
	});

	mqHost.addEventListener('focusout', () => {
		graphItem.selected = false;
	});

	state.items.push(graphItem);

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
		requestAnimationFrame(draw);
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
			requestAnimationFrame(draw);
		}
	});

	if (!window.matchMedia('(orientation: portrait)').matches) {
		graphItem.mathField.focus();
	}
}

function initSidebar() {
	addGraphItem();
	el.sidebar.addEventListener('pointerdown', () => requestAnimationFrame(draw));
	el.fnAdd.addEventListener('click', addGraphItem);
}

export { initSidebar, addGraphItem };