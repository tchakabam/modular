import Context from './Context';

const defaultAudioCtx = Context.getOrCreateDefaultAudioContext();

/**
 * @class
 * @prop knob {Knob} - the knob we monitor
 * monitors a Knob using an AnalyserNode
 *
 */
class Monitor {
	/*
	 * @constructs
	 * @param {Knob} knob - the knob to monitor
	 */
	constructor(knob, canvasContext, windowSize = 8192, frameRateFps = 25) {

		if (!knob || !canvasContext) {
			throw new Error('Monitor needs knob and canvasContext');
		}

		this._knob = knob;
		this._canvasCtx = canvasContext;
		this._windowSize = windowSize;
		this._frameRateFps = frameRateFps;
		this._clickInterval = null;
		
		this._setupAnalyser();
	}

	startClick() {
		if (this._clickInterval) {
			throw new Error('Monitor click already started');
		}
		this._clickInterval = setInterval(this.click.bind(this), 1000 / this._frameRateFps);
	}

	stopClick() {
		clearInterval(this._drawInterval);
		this._clickInterval = null;
	}

	startDraw() {
		if (this._drawFrame) {
			throw new Error('Monitor drawing already started');
		}
		this._drawFrame = requestAnimationFrame(this.runDraw.bind(this));
	}

	stopDraw() {
		if (this._drawFrame) {
			cancelAnimationFrame(this._drawFrame);
		}
		this._drawFrame = null;
	}

	runDraw() {
		this._drawFrame = requestAnimationFrame(this.runDraw.bind(this));

		this.draw(this.canvasCtx);
	}

	destroy() {
		this.stopClick();
	}

	get isClicking() {
		return !! this._clickInterval;
	}

	get frameRate() {
		return this._frameRateFps;
	}

	get windowSize() {
		return this._windowSize;
	}

	get canvasCtx() {
		return this._canvasCtx;
	}

	get rms() {
		const dataArray = new Float32Array(this.analyser.fftSize);
		this.analyser.getFloatTimeDomainData(dataArray);
		const sumOfSquares = dataArray.reduce((prev, current) => {
			return prev + Math.pow(current, 2);
		}, 0);
		return Math.sqrt((sumOfSquares / this.analyser.fftSize));
	}

	get analyser() {
		return this._analyser;
	}

	get knob() {
		return this._knob;
	}

	set knob(knob) {
		if (this.knob) {
			if (this.analyser) {
				this.knob.free(this.analyser);
			}
			this._knob = null;
		}
		if (knob) {
			this._knob = knob;
			this._setupAnalyser();			
		}
	}

	_setupAnalyser() {
		if (!this._analyser) {
			this._analyser = defaultAudioCtx.createAnalyser();
		}

		this.analyser.fftSize = this.windowSize;
		this.knob.drive(this.analyser);
	}

	click() {}

	/**
	 * @abstract
	 * @method
	 * called when Monitor should redraw for some reason
	 */
	draw(canvasContext) {}
}

export default Monitor;