const TOKEN_KIND = Object.freeze({
	NUMBER: 'number',
	IDENTIFIER: 'identifier',
	ASSIGNMENT: '=',
	COMMA: ',',
	PLUS: '+',
	MINUS: '-',
	MULTIPLY: '*',
	CDOT: '\\cdot',
	DIVIDE: '/',
	FRAC: '\\frac',
	POWER: '^',
	L_PARENTHESIS: '(',
	R_PARENTHESIS: ')',
	LEFT_PARENTHESIS: '\\left(',
	RIGHT_PARENTHESIS: '\\right)',
	L_BRACE: '{',
	R_BRACE: '}',
	LEFT_BRACE: '\\left{',
	RIGHT_BRACE: '\\right}',
	SQRT: '\\sqrt',
	SIN: '\\sin',
	COS: '\\cos',
	TG: '\\tg',
	TAN: '\\tan',
	CTG: '\\ctg',
	COT: '\\cot',
	LN: '\\ln',
	LG: '\\lg',
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
});

const OPERATORS = Object.freeze({
	UNARY_PLUS: 'unary_plus',
	UNARY_MINUS: 'unary_minus',
	ADD: 'add',
	SUBTRACT: 'subtract',
	MULTIPLY: 'multiply',
	DIVIDE: 'divide',
	POWER: 'power',
});

const FUNCTIONS = Object.freeze({
	FRAC: 'frac',
	SQRT: 'sqrt',
	SIN: 'sin',
	COS: 'cos',
	TG: 'tg',
	CTG: 'ctg',
	LN: 'ln',
	LG: 'lg',
	UNKNOWN: 'unknown',
});

function functionTokenToName(kind) {
	switch (kind) {
		case TOKEN_KIND.FRAC:
			return FUNCTIONS.FRAC;
		case TOKEN_KIND.SQRT:
			return FUNCTIONS.SQRT;
		case TOKEN_KIND.SIN:
			return FUNCTIONS.SIN;
		case TOKEN_KIND.COS:
			return FUNCTIONS.COS;
		case TOKEN_KIND.TG:
		case TOKEN_KIND.TAN:
			return FUNCTIONS.TG;
		case TOKEN_KIND.CTG:
		case TOKEN_KIND.COT:
			return FUNCTIONS.CTG;
		case TOKEN_KIND.LN:
			return FUNCTIONS.LN;
		case TOKEN_KIND.LG:
			return FUNCTIONS.LG;
		default:
			return FUNCTIONS.UNKNOWN;
	}
}

const NODE_TYPE = Object.freeze({
	NUMBER: 'number',
	VARIABLE: 'variable',
	OPERATOR: 'operator',
	FUNCTION: 'function',
});

class Node {
	constructor(type, value=null, name=null, args=null) {
		this.type = type;
		this.value = value;
		this.name = name;
		this.args = args;
	}
}

export { TOKEN_KIND, TOKEN_KIND_VALUES, Token, OPERATORS_INFO, CONSTANTS, OPERATORS, FUNCTIONS, functionTokenToName, NODE_TYPE, Node };