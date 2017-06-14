import Monitor from '../core/Monitor';

class CanvasMonitor extends Monitor {

	constructor(canvasElement, knob, autoDraw = true) {

		super(knob, canvasElement.getContext('2d'));

		this.canvasElement = canvasElement;

		if (autoDraw) {
			this.startDraw();
		}	
	}

	draw() {
		throw new Error('CanvasMonitor: draw() must be implemented');
	}
}

export default CanvasMonitor;