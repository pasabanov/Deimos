const MATH_EXPRESSION_TYPE = Object.freeze({
	CONSTANT: 'constant',
	EXPRESSION: 'expression',
	SINGLE_VARIABLE_EQUATION: 'single_variable_equation',
	CONSTANT_FUNCTION: 'constant_function',
	EXPLICIT_FUNCTION: 'explicit_function',
	IMPLICIT_FUNCTION: 'implicit_function',
	SYNTAX_ERROR: 'syntax_error',
});

class MathExpression {
	constructor(type, variables, dependent, independent, ast, lhs, rhs, fn) {
		this.type = type;
		this.variables = variables;
		this.dependent = dependent;
		this.independent = independent;
		this.ast = ast;
		this.lhs = lhs;
		this.rhs = rhs;
		this.fn = fn;
	}
}

export { MATH_EXPRESSION_TYPE, MathExpression };