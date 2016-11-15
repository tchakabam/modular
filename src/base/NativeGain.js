import Identity from './Identity';
import Context from '../core/Context';

const defaultAudioCtx = Context.getOrCreateDefaultAudioContext();

class NativeGain extends Identity {
	constructor(gain = null) {
		super('NativeGain');

		// insert GainNode
		this.gainNode = defaultAudioCtx.createGain();
		this.input.connect(this.gainNode);

		// connect to param
		this.createKnob('gain').connect(this.gainNode.gain);

		this.knob('gain').value = gain;
	}

	
	tick(inSample, time, knobsDataHash, knobBufferOffset) {

		const paramDataBuffer = knobsDataHash['gain'];

		if (!paramDataBuffer) {
			return;
		}

		//this.log(paramDataBuffer[knobBufferOffset]);

		if (paramDataBuffer) {
			this.gainNode.gain.value = paramDataBuffer[knobBufferOffset];
		}
	}
	

	get output() {
		return this.gainNode;
	}
}

export default NativeGain;