import Nodule from '../core/Nodule';
import Context from '../core/Context';
import Factory from '../core/Factory';

const defaultAudioCtx = Context.getOrCreateDefaultAudioContext();

class WAGain extends Nodule {
	constructor({gain} = {}) {
		super('WAGain');

		// insert GainNode
		this.gainNode = defaultAudioCtx.createGain();

		// connect to param
		this.createKnob('gain')
			.callibrate(0, 1.0, 0.0001, Nodule.Units.NONE)
			.drive(this.gainNode.gain);

		this.knob('gain').value = gain || 1.0;
	}

	get input() {
		return this.gainNode;
	}
	
	get output() {
		return this.gainNode;
	}
}

Factory.define(WAGain, {
	name: 'WAGain',
	type: Factory.Types.NODULE
});

export default WAGain;