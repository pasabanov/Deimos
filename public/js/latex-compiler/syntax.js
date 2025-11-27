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
	VARPHI: '\\varphi',
	INFTY: '\\infty',
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
	BINOM: '\\binom',
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
	'varphi': (1 + Math.sqrt(5)) / 2,
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
	MOD: 'mod',
	REM: 'rem',
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
	LGAMMA: 'lgamma',
	LABSGAMMA: 'labsgamma',
	BINOM: 'binom',
	MIN: 'min',
	MAX: 'max',
});

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

const NOT_OPERATOR_NAMES = ['frac', 'sqrt', 'root', 'Gamma', 'binom'];

const AUTO_OPERATOR_NAMES_FOR_MATHQUILL
	= Object.values(FUNCTIONS)
		.filter(f => !NOT_OPERATOR_NAMES.includes(f))
		.concat(Object.keys(FUNCTION_ALIASES))
		.join(' ');

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

export { TOKEN_KIND, TOKEN_KIND_VALUES, Token, OPERATORS_INFO, CONSTANTS, OPERATORS, FUNCTIONS, FUNCTION_ALIASES, AUTO_OPERATOR_NAMES_FOR_MATHQUILL, NODE_TYPE, Node };