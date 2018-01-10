import Factory from '../../core/Factory';

import CanvasMonitor from '../CanvasMonitor';

class RMSMeter extends CanvasMonitor {
	constructor({canvasElement, knob, label}) {
		super(canvasElement, knob);
	
		this.label = label || '<unlabeled>';

		this.recalInterval_ = setInterval(() => {
			this.autoCalibrate();
		}, 4000);
	}

	dispose() {
		clearInterval(this.recalInterval_);
	}

	autoCalibrate() {
		this.max = -Infinity;
		this.min = +Infinity;		
	}

	draw(canvasCtx) {
		const rms = this.rms;

		if (rms < this.min) {
			//console.log('update min: ', rms);
			this.min = rms;
		}

		if (rms > this.max) {
			//console.log('update max: ', rms);
			this.max = rms;
		}

		const fontSize = 24;

		const width = this.canvasElement.width;
		const height = this.canvasElement.height;

	    canvasCtx.font =  fontSize + 'px serif';
	    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
	    canvasCtx.fillText(this.label, 0, fontSize);

		canvasCtx.clearRect(0, height , width, - (height - fontSize));
	    canvasCtx.fillStyle = '#F5A503';
	    canvasCtx.fillRect(0, height, width, -1 * ((rms - this.min) / (this.max - this.min)) * (height - fontSize));
	}
}

Factory.define(RMSMeter, {
	name: 'RMSMeter',
	type: Factory.Types.MONITOR
});

export default RMSMeter;