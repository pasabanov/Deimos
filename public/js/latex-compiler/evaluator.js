import { NODE_TYPE, OPERATORS, FUNCTIONS } from './syntax.js';

function evalNode(node, x) {
	switch (node.type) {
		case NODE_TYPE.NUMBER:
			return node.value;
		case NODE_TYPE.VARIABLE:
			return x;
		case NODE_TYPE.OPERATOR: {
			const arg1 = evalNode(node.args[0], x);
			switch (node.name) {
				case OPERATORS.UNARY_PLUS: return arg1;
				case OPERATORS.UNARY_MINUS: return -arg1;
				case OPERATORS.ADD: return arg1 + evalNode(node.args[1], x);
				case OPERATORS.SUBTRACT: return arg1 - evalNode(node.args[1], x);
				case OPERATORS.MULTIPLY: return arg1 * evalNode(node.args[1], x);
				case OPERATORS.DIVIDE: return arg1 / evalNode(node.args[1], x);
				case OPERATORS.POWER: return arg1 ** evalNode(node.args[1], x);
				default: throw new Error(`Unexpected operator: ${node.name}`);
			}
		}
		case NODE_TYPE.FUNCTION: {
			const arg1 = evalNode(node.args[0], x);
			switch (node.name) {
				case FUNCTIONS.FRAC: return arg1 / evalNode(node.args[1], x);
				case FUNCTIONS.SQRT: return Math.sqrt(arg1);
				case FUNCTIONS.ABS: return Math.abs(arg1);
				case FUNCTIONS.SIGN: return Math.sign(arg1);
				case FUNCTIONS.ROUND: return Math.round(arg1);
				case FUNCTIONS.FLOOR: return Math.floor(arg1);
				case FUNCTIONS.CEIL: return Math.ceil(arg1);
				case FUNCTIONS.EXP: return Math.exp(arg1);
				case FUNCTIONS.LN: return Math.log(arg1);
				case FUNCTIONS.LG: return Math.log10(arg1);
				case FUNCTIONS.SIN: return Math.sin(arg1);
				case FUNCTIONS.COS: return Math.cos(arg1);
				case FUNCTIONS.TAN: return Math.tan(arg1);
				case FUNCTIONS.COT: return 1 / Math.tan(arg1);
				case FUNCTIONS.SEC: return 1 / Math.cos(arg1);
				case FUNCTIONS.CSC: return 1 / Math.sin(arg1);
				case FUNCTIONS.ARCSIN: return Math.asin(arg1);
				case FUNCTIONS.ARCCOS: return Math.acos(arg1);
				case FUNCTIONS.ARCTAN: return Math.atan(arg1);
				case FUNCTIONS.ARCCOT: return Math.PI / 2 - Math.atan(arg1);
				case FUNCTIONS.ARCSEC: return Math.acos(1 / arg1);
				case FUNCTIONS.ARCCSC: return Math.asin(1 / arg1);
				case FUNCTIONS.SINH: return Math.sinh(arg1);
				case FUNCTIONS.COSH: return Math.cosh(arg1);
				case FUNCTIONS.TANH: return Math.tanh(arg1);
				case FUNCTIONS.COTH: return 1 / Math.tanh(arg1);
				case FUNCTIONS.SECH: return 1 / Math.sinh(arg1);
				case FUNCTIONS.CSCH: return 1 / Math.cosh(arg1);
				case FUNCTIONS.ARCSINH: return Math.asinh(arg1);
				case FUNCTIONS.ARCCOSH: return Math.acosh(arg1);
				case FUNCTIONS.ARCTANH: return Math.atanh(arg1);
				case FUNCTIONS.ARCCOTH: return Math.log((arg1 + 1) / (arg1 - 1)) / 2;
				case FUNCTIONS.ARCSECH: return Math.acosh(1 / arg1);
				case FUNCTIONS.ARCCSCH: return Math.asinh(1 / arg1);
				case FUNCTIONS.MIN: {
					let min = arg1;
					for (let i = 1; i < node.args.length; ++i) {
						min = Math.min(min, evalNode(node.args[i], x));
					}
					return min;
				}
				case FUNCTIONS.MAX: {
					let max = arg1;
					for (let i = 1; i < node.args.length; ++i) {
						max = Math.max(max, evalNode(node.args[i], x));
					}
					return max;
				}
				default: throw new Error(`Unexpected function: ${node.name}`);
			}
		}
		case NODE_TYPE.IDENTIFIER:
			throw new Error(`Got identifier node with text '${node.text}'. Identifiers are not supported yet`)
		default:
			throw new Error(`Unexpected node type: ${node.type}`);
	}
}

export { evalNode };