import * as mathjs from 'https://cdn.jsdelivr.net/npm/mathjs@11.8.2/+esm';

import { lgamma, labsgamma, binomial } from '../math/index.js';

import { NODE_TYPE, OPERATORS, FUNCTIONS } from './datatypes.js';

function evalNode(node, variables) {
	switch (node.type) {
		case NODE_TYPE.NUMBER:
			return node.value;
		case NODE_TYPE.VARIABLE:
			return variables[node.name];
		case NODE_TYPE.OPERATOR: {
			const arg1 = evalNode(node.args[0], variables);
			switch (node.name) {
				case OPERATORS.UNARY_PLUS: return arg1;
				case OPERATORS.UNARY_MINUS: return -arg1;
				case OPERATORS.ADD: return arg1 + evalNode(node.args[1], variables);
				case OPERATORS.SUBTRACT: return arg1 - evalNode(node.args[1], variables);
				case OPERATORS.MULTIPLY: return arg1 * evalNode(node.args[1], variables);
				case OPERATORS.DIVIDE: return arg1 / evalNode(node.args[1], variables);
				case OPERATORS.POWER: return arg1 ** evalNode(node.args[1], variables);
				case OPERATORS.FACTORIAL: return mathjs.gamma(arg1 + 1);
				default: throw new Error(`Unexpected operator: ${node.name}`);
			}
		}
		case NODE_TYPE.FUNCTION: {
			const arg1 = evalNode(node.args[0], variables);
			switch (node.name) {
				case FUNCTIONS.FRAC: return arg1 / evalNode(node.args[1], variables);
				case FUNCTIONS.SQRT: return Math.sqrt(arg1);
				case FUNCTIONS.ROOT: {
					const degree = arg1;
					const arg = evalNode(node.args[1], variables);
					if (Number.isInteger(degree)) {
						if (degree === 1) {
							return arg;
						}
						if (degree === 2) {
							return Math.sqrt(arg);
						}
						if (degree === 3) {
							return Math.cbrt(arg);
						}
						if (degree === -1) {
							return 1 / arg;
						}
						if (degree === -2) {
							return 1 / Math.sqrt(arg);
						}
						if (degree === -3) {
							return 1 / Math.cbrt(arg);
						}
						if (arg < 0 && degree % 2 !== 0) {
							return -Math.pow(-arg, 1 / degree);
						}
					}
					return Math.pow(arg, 1 / degree);
				}
				case FUNCTIONS.ABS: return Math.abs(arg1);
				case FUNCTIONS.SIGN: return Math.sign(arg1);
				case FUNCTIONS.ROUND: return Math.round(arg1);
				case FUNCTIONS.FLOOR: return Math.floor(arg1);
				case FUNCTIONS.CEIL: return Math.ceil(arg1);
				case FUNCTIONS.MOD: {
					const divisor = evalNode(node.args[1], variables);
					return (arg1 % divisor + divisor) % divisor;
				}
				case FUNCTIONS.REM: return arg1 % evalNode(node.args[1], variables);
				case FUNCTIONS.EXP: return Math.exp(arg1);
				case FUNCTIONS.LN: return Math.log(arg1);
				case FUNCTIONS.LG: return Math.log10(arg1);
				case FUNCTIONS.LB: return Math.log2(arg1);
				case FUNCTIONS.LOG: return Math.log(evalNode(node.args[1], variables)) / Math.log(arg1);
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
				case FUNCTIONS.GAMMA: return mathjs.gamma(arg1);
				case FUNCTIONS.LGAMMA: return lgamma(arg1);
				case FUNCTIONS.LABSGAMMA: return labsgamma(arg1);
				case FUNCTIONS.BINOM: return binomial(arg1, evalNode(node.args[1], variables));
				case FUNCTIONS.MIN: {
					let min = arg1;
					for (let i = 1; i < node.args.length; ++i) {
						min = Math.min(min, evalNode(node.args[i], variables));
					}
					return min;
				}
				case FUNCTIONS.MAX: {
					let max = arg1;
					for (let i = 1; i < node.args.length; ++i) {
						max = Math.max(max, evalNode(node.args[i], variables));
					}
					return max;
				}
				default:
					throw new Error(`Unexpected function: ${node.name}`);
			}
		}
		case NODE_TYPE.IDENTIFIER:
			throw new Error(`Got identifier node with text '${node.text}'. Identifiers are not supported yet`);
		default:
			throw new Error(`Unexpected node type: ${node.type}`);
	}
}

export { evalNode };