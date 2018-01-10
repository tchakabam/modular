import Nodule from '../core/Nodule';
import Context from '../core/Context';
import Factory from '../core/Factory';

const defaultAudioCtx = Context.getOrCreateDefaultAudioContext();

const NAME = 'WABiquadFilter';

const FilterTypes = [
	'allpass',
	'notch',
	'peaking',
	'highshelf',
	'lowshelf',
	'bandpass',
	'highpass',
	'lowpass'
];

class WABiquadFilter extends Nodule {

	static get() {
		return FilterTypes;
	}

	constructor({gain} = {}) {
		super(NAME);

		// insert GainNode
		this.filterNode = defaultAudioCtx.createBiquadFilter();

		// connect to params
		this.createKnob('frequency')
			.callibrate(0, 20000, 0.0001, Nodule.Units.HERTZ)
			.drive(this.filterNode.frequency);
		this.createKnob('detune')
			.callibrate(0, 100, 0.0001, Nodule.Units.CENTS)
			.drive(this.filterNode.detune);
		this.createKnob('q')
			.callibrate(0.0001, 1000, 0.0001, Nodule.Units.NONE)
			.drive(this.filterNode.Q);
		this.createKnob('gain')
			.callibrate(0.0001, 1, 0.0001, Nodule.Units.NONE)
			.drive(this.filterNode.gain);
		this.createKnob('type')
			.callibrate(0, FilterTypes.length - 1, 1, Nodule.Units.NONE)
			.onvalueset = (v) => {
				this.filterNode.type = FilterTypes[v];
			};
	}

	get input() {
		return this.filterNode;
	}
	
	get output() {
		return this.filterNode;
	}
}

Factory.define(WABiquadFilter, {
	name: NAME,
	type: Factory.Types.NODULE
});

export default WABiquadFilter;