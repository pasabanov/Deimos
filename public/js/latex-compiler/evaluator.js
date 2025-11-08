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
				case FUNCTIONS.SIN: return Math.sin(arg1);
				case FUNCTIONS.COS: return Math.cos(arg1);
				case FUNCTIONS.TG: return Math.tan(arg1);
				case FUNCTIONS.CTG: return 1 / Math.tan(arg1);
				case FUNCTIONS.LN: return Math.log(arg1);
				case FUNCTIONS.LG: return Math.log10(arg1);
				default: throw new Error(`Unexpected function: ${node.name}`);
			}
		}
		default:
			throw new Error(`Unexpected node type: ${node.type}`);
	}
}

export { evalNode };