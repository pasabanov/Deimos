import { state, el } from '../core/state.js';
import { draw } from '../graphics/canvas.js';
import { compileLatex } from '../latex-compiler/index.js';
import { AUTO_OPERATOR_NAMES_FOR_MATHQUILL } from '../latex-compiler/syntax.js';

const MQ = window.MathQuill.getInterface(2);

function addFunction(initial) {
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
		charsThatBreakOutOfSupSub: '+-*=',
		autoSubscriptNumerals: true,
		autoCommands: 'Gamma Delta Theta Lambda Xi Upsilon Phi Psi Omega alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi pi varpi rho varrho sigma varsigma tau upsilon phi varphi chi omega frac sqrt nthroot',
		autoOperatorNames: AUTO_OPERATOR_NAMES_FOR_MATHQUILL,
	});
	obj.field = field;

	field.el().addEventListener('focusin', () => {
		obj.selected = true;
		draw();
	});

	field.el().addEventListener('focusout', () => {
		obj.selected = false;
		draw();
	});

	if (initial) {
		field.latex(initial);
	}

	function onChange() {
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
	}

	field.config({ handlers: { edit: onChange } });

	state.functions.push(obj);

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

	del.addEventListener('click', () => {
		const idx = state.functions.findIndex(x => x.id === id);
		if (idx >= 0) {
			state.functions.splice(idx, 1);
		}
		wrapper.remove();
		draw();
	});

	onChange();
}

function initSidebar() {
	addFunction('x');
	addFunction('sin\\left(x\\right)');
	el.addBtn.addEventListener('click', () => addFunction(''));
}

export { initSidebar, addFunction };