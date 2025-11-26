const TOKEN_KIND = Object.freeze({
	NUMBER: 'number',
	IDENTIFIER: 'identifier',
	SPACE: '\\ ',
	ASSIGNMENT: '=',
	COMMA: ',',
	PLUS: '+',
	MINUS: '-',
	MULTIPLY: '*',
	CDOT: '\\cdot',
	DIVIDE: '/',
	FRAC: '\\frac',
	POWER: '^',
	UNDERSCORE: '_',
	L_PARENTHESIS: '(',
	R_PARENTHESIS: ')',
	LEFT_PARENTHESIS: '\\left(',
	RIGHT_PARENTHESIS: '\\right)',
	L_BRACKET: '[',
	R_BRACKET: ']',
	LEFT_BRACKET: '\\left[',
	RIGHT_BRACKET: '\\right]',
	L_BRACE: '{',
	R_BRACE: '}',
	LEFT_BRACE: '\\left{',
	RIGHT_BRACE: '\\right}',
	PI: '\\pi',
	TAU: '\\tau',
	PHI: '\\phi',
	OPERATORNAME: '\\operatorname',
	SQRT: '\\sqrt',
	EXP: '\\exp',
	LN: '\\ln',
	LG: '\\lg',
	LOG: '\\log',
	SIN: '\\sin',
	COS: '\\cos',
	TAN: '\\tan',
	COT: '\\cot',
	SEC: '\\sec',
	CSC: '\\csc',
	ARCSIN: '\\arcsin',
	ARCCOS: '\\arccos',
	ARCTAN: '\\arctan',
	SINH: '\\sinh',
	COSH: '\\cosh',
	TANH: '\\tanh',
	COTH: '\\coth',
	BIG_GAMMA: '\\Gamma',
	FACTORIAL: '!',
	MIN: '\\min',
	MAX: '\\max',
	END: 'end',
	INVALID: 'invalid',
});

const TOKEN_KIND_VALUES = Object.freeze(Object.values(TOKEN_KIND));

class Token {
	constructor(kind, text, pos) {
		this.kind = kind;
		this.text = text;
		this.pos = pos;
	}
}

const OPERATORS_INFO = Object.freeze({
	[TOKEN_KIND.PLUS]: { precedence: 10, associativity: 'L' },
	[TOKEN_KIND.MINUS]: { precedence: 10, associativity: 'L' },
	[TOKEN_KIND.MULTIPLY]: { precedence: 20, associativity: 'L' },
	[TOKEN_KIND.CDOT]: { precedence: 20, associativity: 'L' },
	[TOKEN_KIND.DIVIDE]: { precedence: 20, associativity: 'L' },
	[TOKEN_KIND.POWER]: { precedence: 30, associativity: 'R' },
});

const CONSTANTS = Object.freeze({
	'e': Math.E,
	'pi': Math.PI,
	'tau': 2 * Math.PI,
	'phi': (1 + Math.sqrt(5)) / 2,
});

const OPERATORS = Object.freeze({
	UNARY_PLUS: 'unary_plus',
	UNARY_MINUS: 'unary_minus',
	ADD: 'add',
	SUBTRACT: 'subtract',
	MULTIPLY: 'multiply',
	DIVIDE: 'divide',
	POWER: 'power',
	FACTORIAL: 'factorial',
});

const FUNCTIONS = Object.freeze({
	FRAC: 'frac',
	SQRT: 'sqrt',
	ROOT: 'root',
	ABS: 'abs',
	SIGN: 'sign',
	ROUND: 'round',
	FLOOR: 'floor',
	CEIL: 'ceil',
	EXP: 'exp',
	LN: 'ln',
	LG: 'lg',
	LB: 'lb',
	LOG: 'log',
	SIN: 'sin',
	COS: 'cos',
	TAN: 'tan',
	COT: 'cot',
	SEC: 'sec',
	CSC: 'csc',
	ARCSIN: 'arcsin',
	ARCCOS: 'arccos',
	ARCTAN: 'arctan',
	ARCCOT: 'arccot',
	ARCSEC: 'arcsec',
	ARCCSC: 'arccsc',
	SINH: 'sinh',
	COSH: 'cosh',
	TANH: 'tanh',
	COTH: 'coth',
	SECH: 'sech',
	CSCH: 'csch',
	ARCSINH: 'arcsinh',
	ARCCOSH: 'arccosh',
	ARCTANH: 'arctanh',
	ARCCOTH: 'arccoth',
	ARCSECH: 'arcsech',
	ARCCSCH: 'arccsch',
	GAMMA: 'Gamma',
	MIN: 'min',
	MAX: 'max',
	UNKNOWN: 'unknown',
});

const SPECIAL_FUNCTIONS = ['frac', 'sqrt', 'root', 'Gamma'];

const FUNCTION_ALIASES = Object.freeze({
	'sgn': 'sign',

	'tg': 'tan',
	'ctg': 'cot',
	'cosec': 'csc',

	'asin': 'arcsin',
	'acos': 'arccos',
	'atan': 'arctan',
	'arctg': 'arctan',
	'atg': 'arctan',
	'acot': 'arccot',
	'arcctg': 'arccot',
	'actg': 'arccot',
	'asec': 'arcsec',
	'acsc': 'arccsc',
	'arccosec': 'arccsc',
	'acosec': 'arccsc',

	'tgh': 'tanh',
	'ctgh': 'coth',
	'cosech': 'csch',

	// arcsinh
	'asinh': 'arcsinh',
	// arccosh
	'acosh': 'arccosh',
	// arctanh
	'atanh': 'arctanh',
	'arctgh': 'arctanh',
	'atgh': 'arctanh',
	// arccoth
	'acoth': 'arccoth',
	'arcctgh': 'arccoth',
	'actgh': 'arccoth',
	// arcsech
	'asech': 'arcsech',
	// arccsch
	'acsch': 'arccsch',
	'arccosech': 'arccsch',
	'acosech': 'arccsch',
});

const AUTO_OPERATOR_NAMES_FOR_MATHQUILL
	= Object.values(FUNCTIONS)
		.filter(f => !SPECIAL_FUNCTIONS.includes(f) && f !== 'unknown')
		.concat(Object.keys(FUNCTION_ALIASES))
		.join(' ');

function functionTokenToName(kind) {
	switch (kind) {
		case TOKEN_KIND.FRAC:
			return FUNCTIONS.FRAC;
		case TOKEN_KIND.SQRT:
			return FUNCTIONS.SQRT;
		case TOKEN_KIND.EXP:
			return FUNCTIONS.EXP;
		case TOKEN_KIND.LN:
			return FUNCTIONS.LN;
		case TOKEN_KIND.LG:
			return FUNCTIONS.LG;
		case TOKEN_KIND.LOG:
			return FUNCTIONS.LOG;
		case TOKEN_KIND.SIN:
			return FUNCTIONS.SIN;
		case TOKEN_KIND.COS:
			return FUNCTIONS.COS;
		case TOKEN_KIND.TAN:
			return FUNCTIONS.TAN;
		case TOKEN_KIND.COT:
			return FUNCTIONS.COT;
		case TOKEN_KIND.SEC:
			return FUNCTIONS.SEC;
		case TOKEN_KIND.CSC:
			return FUNCTIONS.CSC;
		case TOKEN_KIND.ARCSIN:
			return FUNCTIONS.ARCSIN;
		case TOKEN_KIND.ARCCSC:
			return FUNCTIONS.ARCCOS;
		case TOKEN_KIND.ARCTAN:
			return Function.ARCTAN;
		case TOKEN_KIND.SINH:
			return FUNCTIONS.SINH;
		case TOKEN_KIND.COSH:
			return FUNCTIONS.COSH;
		case TOKEN_KIND.TANH:
			return FUNCTIONS.TANH;
		case TOKEN_KIND.COTH:
			return FUNCTIONS.COTH;
		case TOKEN_KIND.BIG_GAMMA:
			return FUNCTIONS.GAMMA;
		case TOKEN_KIND.MIN:
			return FUNCTIONS.MIN;
		case TOKEN_KIND.MAX:
			return FUNCTIONS.MAX;
		default:
			return FUNCTIONS.UNKNOWN;
	}
}

const NODE_TYPE = Object.freeze({
	NUMBER: 'number',
	VARIABLE: 'variable',
	OPERATOR: 'operator',
	FUNCTION: 'function',
	IDENTIFIER: 'identifier',
});

class Node {
	constructor(type, value=null, name=null, args=null) {
		this.type = type;
		this.value = value;
		this.name = name;
		this.args = args;
	}
}

export { TOKEN_KIND, TOKEN_KIND_VALUES, Token, OPERATORS_INFO, CONSTANTS, OPERATORS, FUNCTIONS, FUNCTION_ALIASES, AUTO_OPERATOR_NAMES_FOR_MATHQUILL, functionTokenToName, NODE_TYPE, Node };