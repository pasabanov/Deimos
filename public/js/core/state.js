const state = {
	items: [],
	colors: ['#c74440', '#2d70b3', '#348543', '#fa7e19', '#6042a6', '#000000'],
	colorIndex: 0,
	world: { xmin: -10, xmax: 10, ymin: -10, ymax: 10 },
	drag: { active: false, x: NaN, y: NaN, worldStart: { xmin: NaN, xmax: NaN, ymin: NaN, ymax: NaN } },
	pinch: {
		active: false,
		pointer1: { id: -1, x: NaN, y: NaN },
		pointer2: { id: -1, x: NaN, y: NaN },
		startDistance: NaN,
		anchorX: NaN,
		anchorY: NaN,
		worldStart: { xmin: NaN, xmax: NaN, ymin: NaN, ymax: NaN },
	},
	samplesPerPixel: 3,
	preSamples: 3,
	postSamples: 2,
	cropDistance: 1e9,
	trustedDistance: 0,
	marchingSquaresStep: 4,
	returnOnEvalError: true,
	sidebar: {
		moveOutOfFields: false,
	},
	math: {
		defaultLogBase: Math.E,
	},
};

const el = {
	canvas: document.getElementById('canvas'),
	sidebar: document.getElementById('sidebar'),
	fnList: document.getElementById('fn-list'),
	fnAdd: document.getElementById('fn-add'),
	ranges: document.getElementById('ranges'),
	app: document.getElementById('app'),
	resizer: document.getElementById('resizer'),
};

const CURVE_TYPE = Object.freeze({
	EXPLICIT: 'explicit',
	IMPLICIT: 'implicit',
	SINGLE_VARIABLE_EQUATION: 'single_variable_equation',
});

class Curve {
	constructor(type, dependent, independent, fn) {
		this.type = type;
		this.dependent = dependent;
		this.independent = independent;
		this.fn = fn;
	}
}

class CurveItem {
	constructor(id, color, visible, selected, mathField, curve, valuesBuffer) {
		this.id = id;
		this.color = color;
		this.visible = visible;
		this.selected = selected;
		this.mathField = mathField;
		this.curve = curve;
		this.valuesBuffer = valuesBuffer;
	}
}

export { state, el, CURVE_TYPE, Curve, CurveItem };