import { compileLatex } from '../latex-compiler/index.js';
import { MATH_EXPRESSION_TYPE } from '../core/math-expression.js';

function numberToLatex(number) {
	if (!Number.isFinite(number)) {
		return '';
	}
	const s = String(number);
	const i = s.indexOf('e');
	if (i === -1) {
		return s;
	}
	return `${s.slice(0, i)}\\cdot10^{${s.slice(s[i+1] === '+' ? i + 2 : i + 1)}}`;
}

function latexToNumber(latex) {
	try {
		const mathExpression = compileLatex(latex);
		if (mathExpression.type !== MATH_EXPRESSION_TYPE.CONSTANT) {
			return NaN;
		}
		return mathExpression.fn();
	} catch {
		return NaN;
	}
}

export { numberToLatex, latexToNumber };