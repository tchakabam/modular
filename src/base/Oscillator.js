import Nodule from '../core/Nodule';
import Factory from '../core/Factory';

const DEFAULT_FREQ = 440;

const DEFAULT_SAMPLING_FREQ = 44100;

const DEFAULT_WAVETABLE = (function (samples) {

	let wave = [];
	for (let i = 0; i < samples; i++) {
		var normTime = (i / samples);
		var signal = Math.sin(2 * Math.PI * normTime);
		wave.push(signal);
	}
	return wave;

})(DEFAULT_SAMPLING_FREQ);

//console.debug(DEFAULT_WAVETABLE);

class Oscillator extends Nodule {

	constructor({frequency} = {}) {
		super('Oscillator');

		this.createKnob('frequency')
			.callibrate(0, 20000, 0.1)
			.value = frequency || DEFAULT_FREQ;

		/*
		this.createKnob('oct');
		this.createKnob('fm');
		this.createKnob('phase');
		this.createKnob('reset');
		*/

		this.minFreq = Infinity;
		this.maxFreq = -1;
		this.baseFreq = frequency;
		this.previousVal = null;

		this.wavePeriod = DEFAULT_SAMPLING_FREQ;
		this.wave = DEFAULT_WAVETABLE;
		this.previousNormTime = -1;
		this.previousWaveOffset = -1;
	}

	tdtf(sample, time, knobsDataHash, knobBufferOffset) {

		const frequencyCVBuffer = knobsDataHash['frequency'];

		let phase = 0;

		let freq = 0;
		// FIXME: this check shouldn't be needed
		if (frequencyCVBuffer) {
			freq = frequencyCVBuffer[knobBufferOffset];
		} else {
			freq = this.knob('frequency').value;
			this.print('no CV!');
		}

		// compute modulation (FIXME!! clicks with FM because we are not normalizing the time-frequency-domains)

		if (this.previousNormTime >= this.wave.length) {
			this.previousNormTime = -1;
		}

		let normFreq = (freq / (this.wave.length / 2)) * (DEFAULT_SAMPLING_FREQ / 2);
		let waveOffset = Math.floor(++this.previousNormTime * normFreq);

		// XP: PM mode
		let normBaseFreq = (this.baseFreq / (this.wave.length / 2)) * (DEFAULT_SAMPLING_FREQ / 2);
		let normModFreq = ((freq - this.baseFreq) / (this.wave.length / 2)) * (DEFAULT_SAMPLING_FREQ / 2);
		//waveOffset = Math.floor(++this.previousNormTime * normFreq + normModFreq);

		let val = this.wave[waveOffset % this.wave.length];

		this.previousWaveOffset = waveOffset;
		this.previousVal = val;

		//this.log('value: ' + val + ' / frequency: ' + freq + ' / previousNormTime: ' + this.previousNormTime + ' / normFreq: ' + normFreq + ' / waveOffset: ' + waveOffset);

		if (this.maxFreq < freq) {
			//console.debug("max freq: " + freq);
			this.maxFreq = freq;
		}

		if (this.minFreq > freq) {
			//console.debug("min freq: " + freq);
			this.minFreq = freq;
		}

		return val;
	}
}

Factory.define(Oscillator, {
	name: 'Oscillator',
	type: Factory.Types.NODULE
});

export default Oscillator;