import * as mathjs from 'https://cdn.jsdelivr.net/npm/mathjs@11.8.2/+esm';

function lgamma(x) {
	if (x < 0) {
		return Math.log(Math.PI / Math.sin(Math.PI * x)) - mathjs.lgamma(1 - x);
	}
	return mathjs.lgamma(x);
}

function labsgamma(x) {
	if (x < 0) {
		return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - mathjs.lgamma(1 - x);
	}
	return mathjs.lgamma(x);
}

function gammaSign(x) {
	if (x > 0) {
		return 1;
	}
	if (Number.isInteger(x)) {
		return NaN;
	}
	return Math.floor(x) % 2 === 0 ? 1 : -1;
}

function binomial(x, y) {
	if (y === 0 || y === x) {
		return 1;
	}
	if (y === 1 || y === x - 1) {
		return x;
	}
	if (y === 2 || y === x - 2) {
		return x * (x - 1) / 2;
	}
	if (Number.isSafeInteger(x) && Number.isSafeInteger(y)) {
		if (y < 0 || y > x) {
			return 0;
		}
		if (Math.min(y, x - y) <= 1000) {
			let result = 1;
			for (let i = Math.min(y, x - y); i > 0; --i) {
				result = result * (x - i + 1) / i;
			}
			return result;
		}
	}
	const sign = gammaSign(x + 1) * gammaSign(y + 1) * gammaSign(x - y + 1);
	const logValue = labsgamma(x + 1) - labsgamma(y + 1) - labsgamma(x - y + 1);
	return sign * Math.exp(logValue);
}

export { lgamma, labsgamma, binomial };