import Factory from '../../core/Factory';

import CanvasMonitor from '../CanvasMonitor';

import Osc from 'oscilloscope';

const NAME = 'Oscilloscope';

class Oscilloscope extends CanvasMonitor {
	constructor({canvasElement, knob, label}) {
		super(canvasElement, knob);

		this.label = label || '<unlabeled>';

		const options = this.options_ = {
		  stroke: 3,		// size of the wave 
		  glow: 0.1,		// glowing effect 
		  buffer: 1024  // buffer size ranging from 32 to 2048 
		};
		 
		// attach oscilloscope 
		this.scope_ = new Osc(canvasElement, options);
		this.scope_.addSignal(this.analyser, '#00ffff');
	}

	draw() {}
}

Factory.define(Oscilloscope, {
	name: NAME,
	type: Factory.Types.MONITOR
});

export default Oscilloscope;