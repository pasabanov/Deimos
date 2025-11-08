import { TOKEN_KIND, OPERATORS_INFO, CONSTANTS, OPERATORS, FUNCTIONS, functionTokenToName, NODE_TYPE, Node } from './syntax.js';

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

	expect(kind, message=null) {
		if (this.peek().kind !== kind) {
			throw new Error(message ?? `Expected ${kind} but got ${this.peek().kind} at ${this.pos}`);
		}
		this.get();
	}

	expectOneOf(kinds, message=null) {
		for (const kind of kinds) {
			if (this.peek().kind === kind) {
				this.get();
				return;
			}
		}
		throw new Error(message ?? `Expected one of ${kinds} but got ${this.peek().kind} at ${this.pos}`);
	}

	parse() {
		return this.parseAssignment();
	}

	parseAssignment() {
		const lhs = this.parseExpression();
		if (this.match(TOKEN_KIND.ASSIGNMENT)) {
			const rhs = this.parseExpression();
			if (lhs.type === NODE_TYPE.VARIABLE && lhs.name === 'y') {
				return rhs;
			}
		}
		return lhs;
	}

	parseExpression(minPrecedence=0, allowImplicit=true) {
		let left = this.parseUnary();
		while (true) {
			let token = this.peek();
			let info = OPERATORS_INFO[token?.kind];
			let implicit = false;
			if (allowImplicit && !info && this.isImplicitMulAhead()) {
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
		if (negative) {
			return new Node(NODE_TYPE.OPERATOR, null, OPERATORS.UNARY_MINUS, [this.parsePrimary()]);
		}
		return this.parsePrimary();
	}

	parsePrimary() {
		const token = this.peek();
		switch (token.kind) {
			case TOKEN_KIND.NUMBER: {
				this.get();
				return new Node(NODE_TYPE.NUMBER, parseFloat(token.text), null, null);
			}
			case TOKEN_KIND.IDENTIFIER: {
				this.get();
				if (token.text === 'x') {
					return new Node(NODE_TYPE.VARIABLE, null, 'x', null);
				}
				if (token.text === 'y') {
					return new Node(NODE_TYPE.VARIABLE, null, 'y', null);
				}
				if (CONSTANTS.hasOwnProperty(token.text)) {
					return new Node(NODE_TYPE.NUMBER, CONSTANTS[token.text], null, null);
				}
				return new Node(NODE_TYPE.VARIABLE, null, token.text, null);
			}
			case TOKEN_KIND.L_PARENTHESIS:
			case TOKEN_KIND.LEFT_PARENTHESIS: {
				this.get();
				const e = this.parseExpression();
				this.expectOneOf([TOKEN_KIND.R_PARENTHESIS, TOKEN_KIND.RIGHT_PARENTHESIS]);
				return e;
			}
			case TOKEN_KIND.FRAC: {
				this.get();
				this.expect(TOKEN_KIND.L_BRACE);
				const numerator = this.parseExpression();
				this.expect(TOKEN_KIND.R_BRACE);
				this.expect(TOKEN_KIND.L_BRACE);
				const denominator = this.parseExpression();
				this.expect(TOKEN_KIND.R_BRACE);
				return new Node(NODE_TYPE.FUNCTION, null, FUNCTIONS.FRAC, [numerator, denominator]);
			}
			case TOKEN_KIND.SQRT:
			case TOKEN_KIND.SIN:
			case TOKEN_KIND.COS:
			case TOKEN_KIND.TG:
			case TOKEN_KIND.TAN:
			case TOKEN_KIND.CTG:
			case TOKEN_KIND.COT:
			case TOKEN_KIND.LN:
			case TOKEN_KIND.LG: {
				this.get();
				return new Node(NODE_TYPE.FUNCTION, null, functionTokenToName(token.kind), this.parseFuncArguments());
			}
			default:
				throw new Error(`Unexpected token ${token.kind} at ${this.pos}`);
		}
	}

	parseFuncArguments() {
		const braces = this.match(TOKEN_KIND.L_BRACE);
		const parentheses = this.matchOneOf([TOKEN_KIND.L_PARENTHESIS, TOKEN_KIND.LEFT_PARENTHESIS]);
		const allowImplicit = braces || parentheses;
		const minPrecedence = allowImplicit ? 0 : (OPERATORS_INFO[TOKEN_KIND.POWER].precedence);
		let args = [];
		args.push(this.parseExpression(minPrecedence, allowImplicit));
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
			case TOKEN_KIND.NUMBER:
			case TOKEN_KIND.IDENTIFIER:
			case TOKEN_KIND.L_PARENTHESIS:
			case TOKEN_KIND.LEFT_PARENTHESIS:
			case TOKEN_KIND.SIN:
			case TOKEN_KIND.COS:
			case TOKEN_KIND.TG:
			case TOKEN_KIND.TAN:
			case TOKEN_KIND.CTG:
			case TOKEN_KIND.COT:
			case TOKEN_KIND.LN:
			case TOKEN_KIND.LG:
				return true;
			default:
				return false;
		}
	}
}

function parse(tokens) {
	return new Parser(tokens).parse();
}

export { parse };