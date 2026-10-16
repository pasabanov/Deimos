import { tokenize } from './lexer.js';
import { parse } from './parser.js';
import { analyze } from './semantic.js';
import { evalNode } from './evaluator.js';
import { MATH_EXPRESSION_TYPE } from '../core/math-expression.js';

function compileLatex(latex) {
	const mathExpression = analyze(parse(tokenize(latex)));
	switch (mathExpression.type) {
		case MATH_EXPRESSION_TYPE.CONSTANT: {
			const value = evalNode(mathExpression.rhs, { x: NaN, y: NaN });
			mathExpression.fn = () => value;
			return mathExpression;
		}
		case MATH_EXPRESSION_TYPE.EXPRESSION: {
			mathExpression.fn =
				variable => evalNode(mathExpression.rhs, {
					x: mathExpression.independent === 'x' ? variable : NaN,
					y: mathExpression.independent === 'y' ? variable : NaN,
				});
			return mathExpression;
		}
		case MATH_EXPRESSION_TYPE.SINGLE_VARIABLE_EQUATION: {
			mathExpression.fn =
				variable => {
					const variables = {
						x: mathExpression.independent === 'x' ? variable : NaN,
						y: mathExpression.independent === 'y' ? variable : NaN,
					};
					return evalNode(mathExpression.lhs, variables) - evalNode(mathExpression.rhs, variables);
				};
			return mathExpression;
		}
		case MATH_EXPRESSION_TYPE.CONSTANT_FUNCTION: {
			const value = evalNode(mathExpression.rhs, { x: NaN, y: NaN });
			mathExpression.fn = () => value;
			return mathExpression;
		}
		case MATH_EXPRESSION_TYPE.EXPLICIT_FUNCTION: {
			mathExpression.fn =
				variable => evalNode(mathExpression.rhs, {
					x: mathExpression.independent === 'x' ? variable : NaN,
					y: mathExpression.independent === 'y' ? variable : NaN,
				});
			return mathExpression;
		}
		case MATH_EXPRESSION_TYPE.IMPLICIT_FUNCTION: {
			mathExpression.fn =
				(x, y) => {
					const variables = { x, y };
					return evalNode(mathExpression.lhs, variables) - evalNode(mathExpression.rhs, variables);
				};
			return mathExpression;
		}
		case MATH_EXPRESSION_TYPE.SYNTAX_ERROR: {
			mathExpression.fn = () => NaN;
			return mathExpression;
		}
		default:
			throw new Error(`Unknown math expression type: ${mathExpression.type}`);
	}
}

export { compileLatex };