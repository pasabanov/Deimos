import { NODE_TYPE, VARIABLES } from './datatypes.js';
import { evalNode } from './evaluator.js';
import { MATH_EXPRESSION_TYPE, MathExpression } from '../core/math-expression.js';

class Semantic {
	constructor(ast, optimize = true) {
		this.ast = ast;
		this.optimize = optimize;
	}

	collectVariables(node, result = new Set()) {
		if (!node) {
			return result;
		}
		if (node.type === NODE_TYPE.VARIABLE) {
			result.add(node.name);
			return result;
		}
		if (!Array.isArray(node.args)) {
			return result;
		}
		if (this.optimize) {
			const variables = new Set();
			for (const arg of node.args) {
				this.collectVariables(arg, variables);
			}
			if (variables.size === 0) {
				node.value = evalNode(node, { x: NaN, y: NaN });
				node.type = NODE_TYPE.NUMBER;
				node.name = null;
				node.args = null;
			}
			for (const variable of variables) {
				result.add(variable);
			}
		} else {
			for (const arg of node.args) {
				this.collectVariables(arg, result);
			}
		}
		return result;
	}

	analyze() {
		if (this.ast.type === NODE_TYPE.ASSIGNMENT) {
			return this.analyzeAssignment();
		}
		const variables = this.collectVariables(this.ast);
		if (variables.size === 0) {
			return new MathExpression(MATH_EXPRESSION_TYPE.CONSTANT, variables, null, null, this.ast, null, this.ast, null);
		}
		if (variables.size === 1) {
			for (const variable of VARIABLES) {
				if (variables.has(variable)) {
					return new MathExpression(MATH_EXPRESSION_TYPE.EXPRESSION, variables, null, variable, this.ast, null, this.ast, null);
				}
			}
		}
		return new MathExpression(MATH_EXPRESSION_TYPE.SYNTAX_ERROR, variables, null, null, this.ast, null, this.ast, null);
	}

	analyzeAssignment() {
		const [lhs, rhs] = this.ast.args;
		const variables = this.collectVariables(rhs);
		if (lhs.type === NODE_TYPE.VARIABLE) {
			const dependent = lhs.name;
			if (variables.has(dependent)) {
				if (variables.size === 1) {
					return new MathExpression(MATH_EXPRESSION_TYPE.SINGLE_VARIABLE_EQUATION, variables, dependent, dependent, this.ast, lhs, rhs, null);
				}
				return new MathExpression(MATH_EXPRESSION_TYPE.IMPLICIT_FUNCTION, variables, null, null, this.ast, lhs, rhs, null);
			}
			if (variables.size === 0) {
				return new MathExpression(MATH_EXPRESSION_TYPE.CONSTANT_FUNCTION, variables, dependent, null, this.ast, null, rhs, null);
			}
			if (variables.size === 1) {
				for (const variable of VARIABLES) {
					if (variables.has(variable)) {
						return new MathExpression(MATH_EXPRESSION_TYPE.EXPLICIT_FUNCTION, variables, dependent, variable, this.ast, null, rhs, null);
					}
				}
			}
			return new MathExpression(MATH_EXPRESSION_TYPE.SYNTAX_ERROR, variables, null, null, this.ast, null, this.ast, null);
		}
		this.collectVariables(lhs, variables);
		if (variables.size === 1) {
			for (const variable of VARIABLES) {
				if (variables.has(variable)) {
					return new MathExpression(MATH_EXPRESSION_TYPE.SINGLE_VARIABLE_EQUATION, variables, variable, variable, this.ast, lhs, rhs, null);
				}
			}
		}
		return new MathExpression(MATH_EXPRESSION_TYPE.IMPLICIT_FUNCTION, variables, null, null, this.ast, lhs, rhs, null);
	}
}

function analyze(ast) {
	return new Semantic(ast).analyze();
}

export { analyze };