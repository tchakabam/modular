import Node from '../core/Node';

const DEFAULT_FREQ = 440;

class Oscillator extends Node {

	constructor(frequency = DEFAULT_FREQ) {
		super(0, 'Oscillator');
		this.frequency = frequency;
		this.resetTime = 0;

		this.createInput('frequency');

		this.createInput('oct');
		this.createInput('fm');
		this.createInput('phase');
		this.createInput('reset');
	}

	tdtf(inputSample, time, inputsDataHash, inputBufferOffset) {

		if (!this.input('frequency').data) {
			return 0;
		}

		const frequencyCVBuffer = inputsDataHash['frequency'];

		let frequencyCV = 0;
		if (frequencyCVBuffer) {
			frequencyCV = frequencyCVBuffer[inputBufferOffset];
			if (this.resetTime == 0) {
				this.resetTime = time;
				this.log('reset at: ' + time, true);
			}
		}

		let freq = (this.frequency + frequencyCV * 10);
		let val = Math.sin(2*Math.PI * (time - this.resetTime) * freq);

		this.log('value: ' + val + ' / frequency: ' + freq + ' / frequencyCV: ' + frequencyCV);

		return val;
	}
}

export default Oscillator;