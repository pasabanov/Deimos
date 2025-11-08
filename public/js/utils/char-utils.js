function isWhitespace(c) {
	return c === ' ' || '\t' <= c && c <= '\r';
}

function isDigit(c) {
	return '0' <= c && c <= '9';
}

function isAlpha(c) {
	return 'A' <= c && c <= 'Z' || 'a' <= c && c <= 'z';
}

export { isWhitespace, isDigit, isAlpha };