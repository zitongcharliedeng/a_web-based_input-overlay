interface KeyboardState {
	[keyCode: string]: boolean;
}

const keyboard: KeyboardState = {};

document.addEventListener('keydown', function(e: KeyboardEvent): void {
	if (keyboard[e.code] !== true) {
		keyboard[e.code] = true;
	}
});

document.addEventListener('keyup', function(e: KeyboardEvent): void {
	if (keyboard[e.code] === true) {
		keyboard[e.code] = false;
	}
});

export { keyboard };
