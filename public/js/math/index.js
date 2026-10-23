import * as mathjs from 'https://cdn.jsdelivr.net/npm/mathjs@15.2.0/+esm';

function root(radicand, degree) {
	if (Number.isInteger(degree)) {
		switch (degree) {
			case 1: return radicand;
			case 2: return Math.sqrt(radicand);
			case 3: return Math.cbrt(radicand);
			case -1: return 1 / radicand;
			case -2: return 1 / Math.sqrt(radicand);
			case -3: return 1 / Math.cbrt(radicand);
		}
		if (radicand < 0 && degree % 2 !== 0) {
			return -Math.pow(-radicand, 1 / degree);
		}
	}
	return Math.pow(radicand, 1 / degree);
}

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

function cycloid(x, r = 1) {
	if (r <= 0) {
		return NaN;
	}

	x /= r;
	x = Math.abs(x) % (2 * Math.PI);
	x = Math.min(x, 2 * Math.PI - x);

	let t = Math.cbrt(6 * x);

	for (let _ = 0; _ < 10; ++_) {
		const f = t - Math.sin(t) - x;
		const df = 1 - Math.cos(t);

		const delta = f / df;

		if (!Number.isFinite(delta) || delta === 0) {
			break;
		}

		t -= delta;
	}

	return r * (1 - Math.cos(t));
}

function lambertW(x, branch = 0) {
	if (branch !== 0 && branch !== -1) {
		return NaN;
	}
	if (branch === -1 && x >= 0) {
		return NaN;
	}
	if (x < -1 / Math.E) {
		return NaN;
	}

	let t;
	if (branch === 0) {
		if (x > Math.E) {
			t = Math.log(x) - Math.log(Math.log(x));
		} else if (x >= 0) {
			t = x / Math.E;
		} else if (x > -0.36) {
			t = (Math.E * x * Math.log(1 + Math.sqrt(1 + Math.E * x))) / (1 + Math.E * x + Math.sqrt(1 + Math.E * x));
		} else {
			t = -1 + Math.SQRT2 * Math.sqrt(1 + Math.E * x);
		}
	} else {
		if (x > -0.25) {
			t = Math.log(-x) - Math.log(-Math.log(-x));
		} else {
			t = -1 - Math.SQRT2 * Math.sqrt(1 + Math.E * x);
		}
	}

	for (let _ = 0; _ < 10; ++_) {
		const f = t * Math.exp(t) - x;
		const df = (t + 1) * Math.exp(t);

		const delta = f / df;

		if (!Number.isFinite(delta) || delta === 0) {
			break;
		}

		t -= delta;
	}

	return t;
}

export { root, lgamma, labsgamma, binomial, cycloid, lambertW };