import { tokenize } from './lexer.js';
import { parse } from './parser.js';
import { analyze } from './semantic.js';
import { MATH_EXPRESSION_TYPE } from './datatypes.js';
import { evalNode } from './evaluator.js';
import { CURVE_TYPE, Curve } from '../core/state.js';

function compileLatex(latex) {
	const mathExpression = analyze(parse(tokenize(latex)));
	switch (mathExpression.type) {
		case MATH_EXPRESSION_TYPE.CONSTANT: {
			const value = evalNode(mathExpression.rhs, { x: NaN, y: NaN });
			return new Curve(
				CURVE_TYPE.EXPLICIT,
				'y',
				null,
				() => value,
			);
		}
		case MATH_EXPRESSION_TYPE.EXPRESSION: {
			return new Curve(
				CURVE_TYPE.EXPLICIT,
				mathExpression.independent === 'x' ? 'y' : 'x',
				mathExpression.independent,
				variable => evalNode(mathExpression.rhs, {
					x: mathExpression.independent === 'x' ? variable : NaN,
					y: mathExpression.independent === 'y' ? variable : NaN,
				}),
			);
		}
		case MATH_EXPRESSION_TYPE.SINGLE_VARIABLE_EQUATION: {
			return new Curve(
				CURVE_TYPE.SINGLE_VARIABLE_EQUATION,
				mathExpression.dependent,
				mathExpression.independent,
				variable => {
					const variables = {
						x: mathExpression.independent === 'x' ? variable : NaN,
						y: mathExpression.independent === 'y' ? variable : NaN,
					};
					return evalNode(mathExpression.lhs, variables) - evalNode(mathExpression.rhs, variables);
				}
			);
		}
		case MATH_EXPRESSION_TYPE.CONSTANT_FUNCTION: {
			const value = evalNode(mathExpression.rhs, { x: NaN, y: NaN });
			return new Curve(
				CURVE_TYPE.EXPLICIT,
				mathExpression.dependent,
				null,
				() => value,
			);
		}
		case MATH_EXPRESSION_TYPE.EXPLICIT_FUNCTION: {
			return new Curve(
				CURVE_TYPE.EXPLICIT,
				mathExpression.dependent,
				mathExpression.independent,
				variable => evalNode(mathExpression.rhs, {
					x: mathExpression.independent === 'x' ? variable : NaN,
					y: mathExpression.independent === 'y' ? variable : NaN,
				}),
			);
		}
		case MATH_EXPRESSION_TYPE.IMPLICIT_FUNCTION: {
			return new Curve(
				CURVE_TYPE.IMPLICIT,
				null,
				null,
				(x, y) => {
					const variables = { x, y };
					return evalNode(mathExpression.lhs, variables) - evalNode(mathExpression.rhs, variables);
				},
			);
		}
		case MATH_EXPRESSION_TYPE.SYNTAX_ERROR: {
			throw new SyntaxError();
		}
		default:
			throw new Error(`Unknown math expression type: ${mathExpression.type}`);
	}
}

export { compileLatex };