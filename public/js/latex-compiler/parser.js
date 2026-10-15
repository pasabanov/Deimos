import { state } from '../core/state.js';
import { TOKEN_KIND, OPERATORS_INFO, VARIABLES, CONSTANTS, OPERATORS, FUNCTIONS, FUNCTION_ALIASES, NODE_TYPE, Node } from './datatypes.js';

class Parser {
	constructor(tokens) {
		this.tokens = tokens;
		this.pos = 0;
	}

	at(pos) {
		return this.tokens[pos] ?? { kind: TOKEN_KIND.END, text: '', pos: this.pos };
	}

	peek() {
		return this.at(this.pos);
	}

	get() {
		const result = this.at(this.pos);
		if (this.pos < this.tokens.length) {
			++this.pos;
		}
		return result;
	}

	match(kind) {
		if (this.peek().kind === kind) {
			this.get();
			return true;
		}
		return false;
	}

	matchOneOf(kinds) {
		for (const kind of kinds) {
			if (this.peek().kind === kind) {
				this.get();
				return true;
			}
		}
		return false;
	}

	expect(kind) {
		if (this.peek().kind !== kind) {
			throw new Error(`Expected ${kind} but got ${this.peek().kind} at ${this.pos}`);
		}
		this.get();
	}

	expectOneOf(kinds) {
		for (const kind of kinds) {
			if (this.peek().kind === kind) {
				this.get();
				return;
			}
		}
		throw new Error(`Expected one of ${kinds} but got ${this.peek().kind} at ${this.pos}`);
	}

	parse() {
		return this.parseAssignment();
	}

	parseAssignment() {
		const lhs = this.parseExpression();
		if (!this.match(TOKEN_KIND.ASSIGNMENT)) {
			return lhs;
		}
		const rhs = this.parseExpression();
		return new Node(NODE_TYPE.ASSIGNMENT, null, null, [lhs, rhs]);
	}

	parseExpression(minPrecedence=0) {
		let left = this.parseUnary();
		while (true) {
			let token = this.peek();
			let info = OPERATORS_INFO[token?.kind];
			let implicit = false;
			if (!info && this.isImplicitMulAhead()) {
				token = { kind: TOKEN_KIND.MULTIPLY };
				info = OPERATORS_INFO[TOKEN_KIND.MULTIPLY];
				implicit = true;
			}
			if (!info || info.precedence < minPrecedence) {
				break;
			}
			const nextMin = info.associativity === 'L' ? info.precedence + 1 : info.precedence;
			if (!implicit) {
				this.get();
			}
			const right = this.parseExpression(nextMin);
			switch (token.kind) {
				case TOKEN_KIND.PLUS:
					left = new Node(NODE_TYPE.OPERATOR, null, OPERATORS.ADD, [left, right]);
					break;
				case TOKEN_KIND.MINUS:
					left = new Node(NODE_TYPE.OPERATOR, null, OPERATORS.SUBTRACT, [left, right]);
					break;
				case TOKEN_KIND.MULTIPLY:
				case TOKEN_KIND.CDOT:
					left = new Node(NODE_TYPE.OPERATOR, null, OPERATORS.MULTIPLY, [left, right]);
					break;
				case TOKEN_KIND.DIVIDE:
					left = new Node(NODE_TYPE.OPERATOR, null, OPERATORS.DIVIDE, [left, right]);
					break;
				case TOKEN_KIND.POWER:
					left = new Node(NODE_TYPE.OPERATOR, null, OPERATORS.POWER, [left, right]);
					break;
				default:
					throw new Error(`Unknown binary operator: ${token.kind}`);
			}
		}
		return left;
	}

	parseUnary() {
		let negative = false;
		while (this.peek().kind === TOKEN_KIND.PLUS || this.peek().kind === TOKEN_KIND.MINUS) {
			this.match(TOKEN_KIND.PLUS);
			if (this.match(TOKEN_KIND.MINUS)) {
				negative = !negative;
			}
		}
		let e = this.parsePrimary();
		while (this.peek().kind === TOKEN_KIND.FACTORIAL) {
			this.get();
			e = new Node(NODE_TYPE.OPERATOR, null, OPERATORS.FACTORIAL, [e]);
		}
		if (negative) {
			return new Node(NODE_TYPE.OPERATOR, null, OPERATORS.UNARY_MINUS, [e]);
		}
		return e;
	}

	parsePrimary() {
		const token = this.peek();
		switch (token.kind) {
			case TOKEN_KIND.NUMBER: {
				this.get();
				return new Node(NODE_TYPE.NUMBER, parseFloat(token.text), null, null);
			}
			case TOKEN_KIND.PI: {
				this.get();
				return new Node(NODE_TYPE.NUMBER, Math.PI, null, null);
			}
			case TOKEN_KIND.TAU: {
				this.get();
				return new Node(NODE_TYPE.NUMBER, CONSTANTS['tau'], null, null);
			}
			case TOKEN_KIND.PHI: {
				this.get();
				return new Node(NODE_TYPE.NUMBER, CONSTANTS['phi'], null, null);
			}
			case TOKEN_KIND.VARPHI: {
				this.get();
				return new Node(NODE_TYPE.NUMBER, CONSTANTS['varphi'], null, null);
			}
			case TOKEN_KIND.INFTY: {
				this.get();
				return new Node(NODE_TYPE.NUMBER, Infinity, null, null);
			}
			case TOKEN_KIND.IDENTIFIER: {
				this.get();
				if (VARIABLES.includes(token.text)) {
					return new Node(NODE_TYPE.VARIABLE, null, token.text, null);
				}
				if (CONSTANTS.hasOwnProperty(token.text)) {
					return new Node(NODE_TYPE.NUMBER, CONSTANTS[token.text], null, null);
				}
				return new Node(NODE_TYPE.IDENTIFIER, null, token.text, null);
			}
			case TOKEN_KIND.L_PARENTHESIS:
			case TOKEN_KIND.LEFT_PARENTHESIS: {
				this.get();
				const e = this.parseExpression();
				this.expectOneOf([TOKEN_KIND.R_PARENTHESIS, TOKEN_KIND.RIGHT_PARENTHESIS]);
				return e;
			}
			case TOKEN_KIND.L_BRACE: {
				if (this.tokens[this.pos-1].kind === TOKEN_KIND.POWER) {
					this.get();
					const e = this.parseExpression();
					this.expect(TOKEN_KIND.R_BRACE);
					return e;
				} else {
					throw new Error(`Unexpected left brace '{' at ${this.pos}`);
				}
			}
			case TOKEN_KIND.OPERATORNAME: {
				this.get();

				this.expect(TOKEN_KIND.L_BRACE);
				const identifier = this.get();
				if (identifier.kind !== TOKEN_KIND.IDENTIFIER) {
					throw new Error(`Expected identifier after '\\operatorname{' at ${this.pos}`);
				}
				this.expect(TOKEN_KIND.R_BRACE);

				let funcName = identifier.text;
				if (FUNCTION_ALIASES.hasOwnProperty(funcName)) {
					funcName = FUNCTION_ALIASES[funcName];
				}

				let exponent;
				if (this.peek().kind === TOKEN_KIND.POWER) {
					this.get();
					exponent = this.parsePrimary();
				}

				const f = new Node(NODE_TYPE.FUNCTION, null, funcName, this.parseFuncArguments());
				if (exponent !== undefined) {
					return new Node(NODE_TYPE.OPERATOR, null, OPERATORS.POWER, [f, exponent]);
				} else {
					return f;
				}
			}
			case TOKEN_KIND.FRAC: {
				this.get();
				let numerator, denominator;
				if (this.match(TOKEN_KIND.L_BRACE)) {
					numerator = this.parseExpression();
					this.expect(TOKEN_KIND.R_BRACE);
				} else {
					numerator = this.parsePrimary();
				}
				if (this.match(TOKEN_KIND.L_BRACE)) {
					denominator = this.parseExpression();
					this.expect(TOKEN_KIND.R_BRACE);
				} else {
					denominator = this.parsePrimary();
				}
				return new Node(NODE_TYPE.FUNCTION, null, FUNCTIONS.FRAC, [numerator, denominator]);
			}
			case TOKEN_KIND.BINOM: {
				this.get();
				let n, k;
				if (this.match(TOKEN_KIND.L_BRACE)) {
					n = this.parseExpression();
					this.expect(TOKEN_KIND.R_BRACE);
				} else {
					n = this.parsePrimary();
				}
				if (this.match(TOKEN_KIND.L_BRACE)) {
					k = this.parseExpression();
					this.expect(TOKEN_KIND.R_BRACE);
				} else {
					k = this.parsePrimary();
				}
				return new Node(NODE_TYPE.FUNCTION, null, FUNCTIONS.BINOM, [n, k]);
			}
			case TOKEN_KIND.SQRT: {
				this.get();
				let degree;
				if (this.peek().kind === TOKEN_KIND.L_BRACKET) {
					this.get();
					degree = this.parseExpression();
					this.expect(TOKEN_KIND.R_BRACKET);
				}
				const args = this.parseFuncArguments();
				if (degree === undefined) {
					return new Node(NODE_TYPE.FUNCTION, null, FUNCTIONS.SQRT, args);
				} else {
					return new Node(NODE_TYPE.FUNCTION, null, FUNCTIONS.ROOT, [degree].concat(args));
				}
			}
			case TOKEN_KIND.LOG: {
				this.get();
				let exponent;
				let base;
				while (this.peek().kind === TOKEN_KIND.POWER || this.peek().kind === TOKEN_KIND.UNDERSCORE) {
					if (this.peek().kind === TOKEN_KIND.POWER) {
						this.get();
						exponent = this.parsePrimary();
					} else {
						this.get();
						base = this.parsePrimary();
					}
				}
				if (base === undefined) {
					base = new Node(NODE_TYPE.NUMBER, state.math.defaultLogBase, null, null);
				}
				const f = new Node(NODE_TYPE.FUNCTION, null, FUNCTIONS.LOG, [base].concat(this.parseFuncArguments()));
				if (exponent !== undefined) {
					return new Node(NODE_TYPE.OPERATOR, null, OPERATORS.POWER, [f, exponent]);
				} else {
					return f;
				}
			}
			case TOKEN_KIND.EXP:
			case TOKEN_KIND.LN:
			case TOKEN_KIND.LG:
			case TOKEN_KIND.SIN:
			case TOKEN_KIND.COS:
			case TOKEN_KIND.TG:
			case TOKEN_KIND.TAN:
			case TOKEN_KIND.CTG:
			case TOKEN_KIND.COT:
			case TOKEN_KIND.SEC:
			case TOKEN_KIND.CSC:
			case TOKEN_KIND.ARCSIN:
			case TOKEN_KIND.ARCCOS:
			case TOKEN_KIND.ARCTAN:
			case TOKEN_KIND.SINH:
			case TOKEN_KIND.COSH:
			case TOKEN_KIND.TANH:
			case TOKEN_KIND.COTH:
			case TOKEN_KIND.BIG_GAMMA:
			case TOKEN_KIND.MIN:
			case TOKEN_KIND.MAX: {
				this.get();
				let exponent;
				if (this.peek().kind === TOKEN_KIND.POWER) {
					this.get();
					exponent = this.parsePrimary();
				}
				const f = new Node(NODE_TYPE.FUNCTION, null, token.kind.substring(1), this.parseFuncArguments());
				if (exponent !== undefined) {
					return new Node(NODE_TYPE.OPERATOR, null, OPERATORS.POWER, [f, exponent]);
				} else {
					return f;
				}
			}
			default:
				throw new Error(`Unexpected token ${token.kind} at ${this.pos}`);
		}
	}

	parseFuncArguments() {
		const braces = this.match(TOKEN_KIND.L_BRACE);
		const parentheses = this.matchOneOf([TOKEN_KIND.L_PARENTHESIS, TOKEN_KIND.LEFT_PARENTHESIS]);
		const minPrecedence = braces || parentheses ? 0 : (OPERATORS_INFO[TOKEN_KIND.MULTIPLY].precedence);
		let args = [];
		args.push(this.parseExpression(minPrecedence));
		if (braces || parentheses) {
			while (this.match(TOKEN_KIND.COMMA)) {
				args.push(this.parseExpression());
			}
		}
		if (parentheses) {
			this.expectOneOf([TOKEN_KIND.R_PARENTHESIS, TOKEN_KIND.RIGHT_PARENTHESIS]);
		}
		if (braces) {
			this.expect(TOKEN_KIND.R_BRACE);
		}
		return args;
	}

	isImplicitMulAhead() {
		const k = this.peek().kind;
		switch (k) {
			case TOKEN_KIND.SPACE:
			case TOKEN_KIND.ASSIGNMENT:
			case TOKEN_KIND.COMMA:
			case TOKEN_KIND.PLUS:
			case TOKEN_KIND.MINUS:
			case TOKEN_KIND.MULTIPLY:
			case TOKEN_KIND.CDOT:
			case TOKEN_KIND.DIVIDE:
			case TOKEN_KIND.POWER:
			case TOKEN_KIND.UNDERSCORE:
			case TOKEN_KIND.R_PARENTHESIS:
			case TOKEN_KIND.RIGHT_PARENTHESIS:
			case TOKEN_KIND.L_BRACKET:
			case TOKEN_KIND.R_BRACKET:
			case TOKEN_KIND.LEFT_BRACKET:
			case TOKEN_KIND.RIGHT_BRACKET:
			case TOKEN_KIND.L_BRACE:
			case TOKEN_KIND.R_BRACE:
			case TOKEN_KIND.LEFT_BRACE:
			case TOKEN_KIND.RIGHT_BRACE:
			case TOKEN_KIND.FACTORIAL:
			case TOKEN_KIND.END:
			case TOKEN_KIND.INVALID:
				return false;
			default:
				return true;
		}
	}
}

function parse(tokens) {
	return new Parser(tokens).parse();
}

export { parse };