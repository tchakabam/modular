import Nodule from '../core/Nodule';
import Factory from '../core/Factory';

const DEFAULT_NOTE = 0;
const DEFAULT_OCT = 1;

const DEFAULT_SAMPLING_FREQ = 44100;

const SINE_WAVETABLE = (function (samples) {

	let wave = [];
	for (let i = 0; i < samples; i++) {
		var normTime = (i / samples);
		var signal = Math.sin(2 * Math.PI * normTime);
		wave.push(signal);
	}
	return wave;

})(DEFAULT_SAMPLING_FREQ);

const SQUARE_WAVETABLE = (function (samples) {

	let wave = [];
	for (let i = 0; i < samples; i++) {
		if (i < DEFAULT_SAMPLING_FREQ / 2) {
			wave.push(1);
		} else {
			wave.push(-1);
		}
	}
	return wave;

})(DEFAULT_SAMPLING_FREQ);

//console.debug(DEFAULT_WAVETABLE);

class Oscillator extends Nodule {

	constructor({note, octave} = {}) {
		super('Oscillator');

		this.createKnob('note')
			.callibrate(0, 1, (1 / 12), Nodule.Units.NONE)
			.default(DEFAULT_NOTE)
			.value = note;

		this.createKnob('octave')
			.callibrate(0, +5, 0.001, Nodule.Units.NONE)
			.default(DEFAULT_OCT)
			.value = octave;

		this.createKnob('waveform')
			.callibrate(0, 1, 1, Nodule.Units.NONE)
			.default(0);

		this.previousVal = null;

		this.wavePeriod = DEFAULT_SAMPLING_FREQ;
		this.wave = SINE_WAVETABLE;
		this.wavetables = [
			SINE_WAVETABLE,
			SQUARE_WAVETABLE
		];
		this.previousNormTime = -1;
		this.previousWaveOffset = -1;
	}

	tdtf(sample, time, knobsDataHash, knobBufferOffset) {

		const noteMod = knobsDataHash['note'][knobBufferOffset];
		const oct = knobsDataHash['octave'][knobBufferOffset];

		const waveform = this.knob('waveform').value;
		const freq = 440 * Math.pow(2, noteMod);

		this.wave = this.wavetables[waveform];

		this.baseFreq = 440 * Math.pow(2, this.knob('note').value);

		// compute modulation (FIXME!! clicks with FM because we are not normalizing the time-frequency-domains)

		if (this.previousNormTime >= this.wave.length) {
			this.previousNormTime = -1;
		}

		let normFreq = oct * (freq / (this.wave.length / 2)) * (DEFAULT_SAMPLING_FREQ / 2);
		let waveOffset = Math.floor(++this.previousNormTime * normFreq);

		// XP: PM mode
		let normBaseFreq = (this.baseFreq / (this.wave.length / 2)) * (DEFAULT_SAMPLING_FREQ / 2);
		let normModFreq = ((freq - this.baseFreq) / (this.wave.length / 2)) * (DEFAULT_SAMPLING_FREQ / 2);

		let val = this.wave[waveOffset % this.wave.length];

		this.previousWaveOffset = waveOffset;
		this.previousVal = val;

		//this.log('value: ' + val + ' / frequency: ' + freq + ' / previousNormTime: ' + this.previousNormTime + ' / normFreq: ' + normFreq + ' / waveOffset: ' + waveOffset);

		return val;
	}
}

Factory.define(Oscillator, {
	name: 'Oscillator',
	type: Factory.Types.NODULE
});

export default Oscillator;