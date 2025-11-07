(function () {
	'use strict';

	// ==== Tokenizer ====
	function tokenize(latex) {
		const tokens = [];
		const s = String(latex || '');
		let i = 0;

		while (i < s.length) {
			const c = s[i];

			if (/\s/.test(c)) {
				++i;
				continue;
			}

			if (c === '\\') {
				let j = i + 1;
				while (j < s.length && /[a-zA-Z]/.test(s[j])) {
					++j;
				}
				tokens.push({ t: 'cmd', v: s.slice(i + 1, j) });
				i = j;
				continue;
			}

			if (/[0-9.]/.test(c)) {
				let j = i + 1;
				let hasDot = c === '.';
				while (j < s.length && (/[0-9]/.test(s[j]) || (!hasDot && s[j] === '.'))) {
					if (s[j] === '.') {
						hasDot = true;
					}
					++j;
				}
				tokens.push({ t: 'num', v: s.slice(i, j) });
				i = j;
				continue;
			}

			if (/[a-zA-Z]/.test(c)) {
				let j = i + 1;
				while (j < s.length && /[a-zA-Z]/.test(s[j])) {
					++j;
				}
				tokens.push({ t: 'id', v: s.slice(i, j) });
				i = j;
				continue;
			}

			if ('+-*/^(){}=,'.includes(c)) {
				tokens.push({ t: c, v: c });
				++i;
				continue;
			}

			++i;
		}

		return tokens;
	}


	// ==== Parser ====
	class Parser {
		constructor(tokens) {
			this.ts = tokens;
			this.i = 0;
		}

		peek() {
			return this.ts[this.i] || null;
		}

		eat(t) {
			const k = this.peek();
			if (k && (!t || k.t === t)) {
				++this.i;
				return k;
			}
			return null;
		}

		parse() {
			const expr = this.parseEquality();
			return expr;
		}

		parseEquality() {
			let left = this.parseExpr();
			const k = this.peek();
			if (k && k.t === '=') {
				this.eat('=');
				left = this.parseExpr();
			}
			return left;
		}

		parseExpr() {
			let node = this.parseTerm();
			for (;;) {
				const k = this.peek();
				if (k && (k.t === '+' || k.t === '-')) {
					this.eat(k.t);
					const r = this.parseTerm();
					node = { type: k.t === '+' ? 'add' : 'sub', a: node, b: r };
					continue;
				}
				break;
			}
			return node;
		}

		parseTerm() {
			let node = this.parsePow();
			for (;;) {
				const k = this.peek();
				if (k && (k.t === '*' || k.t === '/' || this.isImplicitMulAhead())) {
					if (k && (k.t === '*' || k.t === '/')) {
						this.eat(k.t);
					}
					const r = this.parsePow();
					const op = k && k.t === '/' ? 'div' : 'mul';
					node = { type: op, a: node, b: r };
					continue;
				}
				break;
			}
			return node;
		}

		isImplicitMulAhead() {
			const a = this.ts[this.i-1] || null;
			const b = this.peek();
			if (!b) {
				return false;
			}
			const aType = a ? (a.t === 'num' || a.t === 'id' || a.t === 'cmd' || a.t === ')' || a.t === '}') : false;
			const bType = b.t === 'num' || b.t === 'id' || b.t === 'cmd' || b.t === '(' || b.t === '{';
			return aType && bType;
		}

		parsePow() {
			let node = this.parseUnary();
			const k = this.peek();
			if (k && k.t === '^') {
				this.eat('^');
				const r = this.parseUnary();
				node = { type: 'pow', a: node, b: r };
				return this.parsePowR(node);
			}
			return node;
		}

		parsePowR(left) {
			const k = this.peek();
			if (k && k.t === '^') {
				this.eat('^');
				const r = this.parseUnary();
				const node = { type: 'pow', a: left, b: r };
				return this.parsePowR(node);
			}
			return left;
		}

		parseUnary() {
			const k = this.peek();
			if (k && (k.t === '+' || k.t === '-')) {
				this.eat(k.t);
				const u = this.parseUnary();
				return k.t === '+' ? u : { type: 'neg', a: u };
			}
			return this.parsePrimary();
		}

		parseGroup() {
			const k = this.peek();
			if (k && k.t === '(') {
				this.eat('(');
				const e = this.parseExpr();
				this.eat(')');
				return e;
			}
			if (k && k.t === '{') {
				this.eat('{');
				const e = this.parseExpr();
				this.eat('}');
				return e;
			}
			return null;
		}

		parsePrimary() {
			const k = this.peek();
			if (!k) {
				return { type: 'num', v: NaN };
			}

			if (k.t === 'num') {
				this.eat('num');
				return { type: 'num', v: parseFloat(k.v) };
			}

			if (k.t === 'id') {
				this.eat('id');
				if (k.v === 'x') {
					return { type: 'var' };
				}
				if (k.v === 'e') {
					return { type: 'num', v: Math.E };
				}
				return { type: 'sym', v: k.v };
			}

			if (k.t === 'cmd') {
				this.eat('cmd');

				if (k.v === 'pi') {
					return { type: 'num', v: Math.PI };
				}

				if (k.v === 'sqrt') {
					const g = this.parseGroup() || this.parsePrimary();
					return { type: 'func', n: 'sqrt', a: g };
				}

				const name = cmdToName(k.v);
				const arg = this.parseGroup() || this.parsePrimary();
				return { type: 'func', n: name, a: arg };
			}

			if (k.t === '(' || k.t === '{') {
				const g = this.parseGroup();
				return g || { type: 'num', v: NaN };
			}

			return { type: 'num', v: NaN };
		}
	}


	// ==== AST Evaluation ====
	function cmdToName(cmd) {
		switch (cmd) {
			case 'sin': return 'sin';
			case 'cos': return 'cos';
			case 'tan': return 'tan';
			case 'ln': return 'ln';
			case 'lg': return 'lg';
			default: return cmd;
		}
	}

	function evalNode(n, x) {
		switch (n.type) {
			case 'num':
				return n.v;
			case 'var':
				return x;
			case 'neg':
				return -evalNode(n.a, x);
			case 'add':
				return evalNode(n.a, x) + evalNode(n.b, x);
			case 'sub':
				return evalNode(n.a, x) - evalNode(n.b, x);
			case 'mul':
				return evalNode(n.a, x) * evalNode(n.b, x);
			case 'div':
				return evalNode(n.a, x) / evalNode(n.b, x);
			case 'pow':
				return Math.pow(evalNode(n.a, x), evalNode(n.b, x));
			case 'func': {
				const v = evalNode(n.a, x);
				switch (n.n) {
					case 'sqrt': return Math.sqrt(v);
					case 'sin': return Math.sin(v);
					case 'cos': return Math.cos(v);
					case 'tan': return Math.tan(v);
					case 'ln': return Math.log(v);
					case 'lg': return Math.log10(v);
					default: return NaN;
				}
			}
			default:
				return NaN;
		}
	}

	function compileAst(ast) {
		return function (x) {
			return evalNode(ast, x);
		};
	}


	// ==== Public API ====
	function takeRHSIfEq(latex) {
		const parts = String(latex).split('=');
		if (parts.length <= 1) {
			return latex;
		}
		if (/^\\?y$/i.test(parts[0].replace(/[{}]/g, ''))) {
			return parts.slice(1).join('=');
		}
		return parts.slice(1).join('=');
	}

	function cleanupLatex(s) {
		return s
			.replace(/\\left/g, '')
			.replace(/\\right/g, '')
			.replace(/\\cdot/g, '*');
	}

	function compileLatex(latex) {
		const rhs = takeRHSIfEq(latex);
		const cleaned = cleanupLatex(rhs);
		const ts = tokenize(cleaned);
		const p = new Parser(ts);
		const ast = p.parse();
		return compileAst(ast);
	}

	window.compileLatex = compileLatex;
})();