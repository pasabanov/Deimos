import { state, el } from '../core/state.js';
import { draw } from '../graphics/canvas.js';
import { compileLatex } from '../latex-compiler/index.js';

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
		fn: () => NaN,
	};

	const field = MQ.MathField(mqHost, {
		spaceBehavesLikeTab: true,
		autoCommands: 'pi theta sqrt',
		autoOperatorNames: 'sin cos tan cot ln lg',
	});
	obj.field = field;

	if (initial) {
		field.latex(initial);
	}

	function onChange() {
		const latex = field.latex().trim();

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