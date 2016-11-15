import Identity from './Identity';
import Context from '../core/Context';

const defaultAudioCtx = Context.getOrCreateDefaultAudioContext();

class NativeGain extends Identity {
	constructor(gain = 1.0) {
		super('NativeGain');

		// insert GainNode
		this.gainNode = defaultAudioCtx.createGain();

		// connect to param
		this.createKnob('gain').drive(this.gainNode.gain);

		this.knob('gain').value = 1.0;
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

export default NativeGain;