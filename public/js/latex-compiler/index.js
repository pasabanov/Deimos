import { tokenize } from './lexer.js';
import { parse } from './parser.js';
import { evalNode } from './evaluator.js';

function compileLatex(latex) {
	const ast = parse(tokenize(latex));
	return x => evalNode(ast, x);
}

export { compileLatex };