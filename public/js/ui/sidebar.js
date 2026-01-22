import { state, el } from '../core/state.js';
import { draw } from '../graphics/canvas.js';
import { compileLatex } from '../latex-compiler/index.js';
import { AUTO_COMMANDS_FOR_MATHQUILL, AUTO_OPERATOR_NAMES_FOR_MATHQUILL } from '../latex-compiler/syntax.js';

const MQ = window.MathQuill.getInterface(2);

function addFunction() {
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
		selected: false,
		fn: () => NaN,
	};

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
				if (!latex) {
					obj.fn = () => NaN;
					draw();
					return;
				}
				try {
					obj.fn = compileLatex(latex);
				} catch (e) {
					obj.fn = () => NaN;
				}
				draw();
			},
			enter: () => {
				addFunction();
				const idx = state.functions.findIndex(x => x.id === id);
				state.functions[idx+1].field.focus();
			},
			moveOutOf: dir => {
				if (state.config.moveOutOfFields) {
					if (dir === MQ.L) {
						const idx = state.functions.findIndex(x => x.id === id);
						if (idx > 0) {
							state.functions[idx-1].field.focus();
						}
					} else if (dir === MQ.R) {
						const idx = state.functions.findIndex(x => x.id === id);
						if (idx !== -1 && idx + 1 < state.functions.length) {
							state.functions[idx+1].field.focus();
						}
					}
				}
			},
			deleteOutOf: dir => {
				if (dir === MQ.L) {
					const idx = state.functions.findIndex(x => x.id === id);
					if (idx > 0) {
						state.functions.splice(idx, 1);
						wrapper.remove();
						state.functions[idx-1].field.focus();
					}
				}
			},
			upOutOf: () => {
				const idx = state.functions.findIndex(x => x.id === id);
				if (idx > 0) {
					state.functions[idx-1].field.focus();
				}
			},
			downOutOf: () => {
				const idx = state.functions.findIndex(x => x.id === id);
				if (idx !== -1 && idx + 1 < state.functions.length) {
					state.functions[idx+1].field.focus();
				}
			},
		},
	});
	obj.field = field;

	mqHost.addEventListener('focusin', () => {
		obj.selected = true;
		draw();
	});

	mqHost.addEventListener('focusout', () => {
		obj.selected = false;
	});

	state.functions.push(obj);

	colorDot.addEventListener('mousedown', e => e.preventDefault());
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

	del.addEventListener('mousedown', e => e.preventDefault());
	del.addEventListener('click', () => {
		const idx = state.functions.findIndex(x => x.id === id);
		if (idx >= 0) {
			state.functions.splice(idx, 1);
			wrapper.remove();
			if (state.functions.length === 0) {
				addFunction();
				state.functions[0].field.focus();
			}
			draw();
		}
	});
}

function initSidebar() {
	addFunction();
	state.functions[0].field.focus();
	el.sidebar.addEventListener('mousedown', () => requestAnimationFrame(draw));
}

export { initSidebar, addFunction };