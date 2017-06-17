import Identity from './Identity';
import Context from '../core/Context';
import Factory from '../core/Factory';

const defaultAudioCtx = Context.getOrCreateDefaultAudioContext();

class NativeGain extends Identity {
	constructor({gain} = {}) {
		super({name: 'Gain'});

		// insert GainNode
		this.gainNode = defaultAudioCtx.createGain();

		// connect to param
		this.createKnob('gain')
			.callibrate(0, 1.0, 0.0001)
			.drive(this.gainNode.gain);

		this.knob('gain').value = gain || 1.0;
	}

	tick(inSample, time, knobsDataHash, knobBufferOffset) {

	}

	get input() {
		return this.gainNode;
	}
	
	get output() {
		return this.gainNode;
	}
}

Factory.define(NativeGain, {
	name: 'NativeGain',
	type: Factory.Types.NODULE
});

export default NativeGain;