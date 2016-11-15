import Nodule from '../core/Nodule';

const DEFAULT_FREQ = 440;

class Oscillator extends Nodule {

	constructor(frequency = DEFAULT_FREQ) {
		super('Oscillator');
		this.frequency = frequency;
		this.resetTime = 0;

		this.createKnob('frequency');

		//this.createKnob('oct');
		/*
		
		this.createKnob('fm');
		this.createKnob('phase');
		this.createKnob('reset');
		*/
	}

	tdtf(sample, time, knobsDataHash, knobBufferOffset) {

		const frequencyCVBuffer = knobsDataHash['frequency'];

		let frequencyCV = 0;
		if (frequencyCVBuffer) {
			frequencyCV = frequencyCVBuffer[knobBufferOffset];
		}

		let freq = (this.frequency + frequencyCV * 10);
		let val = Math.sin(2*Math.PI * (time - this.resetTime) * freq);

		//this.log('value: ' + val + ' / frequency: ' + freq + ' / frequencyCV: ' + frequencyCV);

		return val;
	}
}

export default Oscillator;