import { isWhitespace, isDigit, isAlpha } from '../utils/char-utils.js';
import { VARIABLES, CONSTANT_NAMES, TOKEN_KIND, TOKEN_KIND_VALUES, Token } from './syntax.js';


class Lexer {
	constructor(text) {
		this.text = text;
		this.pos = 0;
	}

	peek() {
		return this.text[this.pos];
	}

	get() {
		return this.text[this.pos++];
	}

	skipWhitespace() {
		while (isWhitespace(this.peek())) {
			this.get();
		}
	}

	readNumber() {
		const pos = this.pos;
		let num = '';
		let sawDot = false;
		while (true) {
			const c = this.peek();
			if (isDigit(c)) {
				num += this.get();
				continue;
			}
			if (c === '.' && !sawDot) {
				sawDot = true;
				num += this.get();
				continue;
			}
			break;
		}
		return new Token(TOKEN_KIND.NUMBER, num, pos);
	}

	readIdentifier() {
		const start = this.pos;
		let current = '';
		let lastValid = '';
		while (isAlpha(this.peek())) {
			current += this.get();
			if (VARIABLES.includes(current) || CONSTANT_NAMES.includes(current)) {
				lastValid = current;
			}
		}
		if (lastValid === '') {
			lastValid = current;
		}
		this.pos = start + lastValid.length;
		return new Token(TOKEN_KIND.IDENTIFIER, lastValid, start);
	}

	tokenize() {
		let tokens = [];
		this.skipWhitespace();
		while (this.pos < this.text.length) {
			const c = this.peek();
			if (isDigit(c)) {
				tokens.push(this.readNumber());
			} else if (isAlpha(c)) {
				tokens.push(this.readIdentifier());
			} else {
				const start = this.pos;
				let current = '';
				let lastValid = '';
				let candidates = Object.values(TOKEN_KIND).filter(k => k[0] === this.peek());
				while (candidates.length > 0) {
					current += this.get();
					if (TOKEN_KIND_VALUES.includes(current)) {
						lastValid = current;
					}
					candidates = candidates.filter(candidate => candidate.length >= current.length && candidate[current.length-1] === current[current.length-1]);
				}
				if (lastValid === '') {
					tokens.push(new Token(TOKEN_KIND.INVALID, this.get(), start));
				} else {
					this.pos = start + lastValid.length;
					if (lastValid !== TOKEN_KIND.SPACE) {
						tokens.push(new Token(lastValid, lastValid, start));
					}
				}
			}
			this.skipWhitespace();
			if (tokens[tokens.length-1].kind === TOKEN_KIND.POWER || tokens[tokens.length-1].kind === TOKEN_KIND.UNDERSCORE) {
				if (isDigit(this.peek())) {
					tokens.push(new Token(TOKEN_KIND.NUMBER, this.get(), this.pos - 1));
				} else if (isAlpha(this.peek())) {
					tokens.push(new Token(TOKEN_KIND.IDENTIFIER, this.get(), this.pos - 1));
				}
				this.skipWhitespace();
			}
		}
		return tokens;
	}
}

function tokenize(latex) {
	return new Lexer(latex).tokenize();
}

export { tokenize };