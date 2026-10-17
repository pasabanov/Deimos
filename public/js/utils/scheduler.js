const pending = new Set();

let scheduled = false;

function requestSeparateFrameOnce(callback) {
	pending.add(callback);
	if (scheduled) {
		return;
	}
	scheduled = true;
	requestAnimationFrame(processFrame);
}

function processFrame() {
	if (pending.size === 0) {
		scheduled = false;
		return;
	}
	const callback = pending.values().next().value;
	pending.delete(callback);
	callback();
	requestAnimationFrame(processFrame);
}

export { requestSeparateFrameOnce };