import Context from './Context';

const QUEUE_MAX_SIZE = 4096;

const defaultAudioCtx = Context.getOrCreateDefaultAudioContext();

import SometimesDoer from '../util/SometimesDoer';
const doer = new SometimesDoer(0.01);
const ENABLE_LOG = true;

class Knob {
	constructor(processFunc = function() {}, bufferSize = 8192, initialValue = 0.0) {
		this.id_ = Context.newGuid();

		const gain = defaultAudioCtx.createGain();
		const buffer = defaultAudioCtx.createBuffer(1, 128, defaultAudioCtx.sampleRate);
		const arr = buffer.getChannelData(0);
		for (let i = 0; i < arr.length; i++){
			arr[i] = 1;
		}
		const bufferSource = defaultAudioCtx.createBufferSource();
		bufferSource.channelCount = 1;
		bufferSource.channelCountMode = "explicit";
		bufferSource.buffer = buffer;
		bufferSource.loop = true;
		bufferSource.start(0);
		//bufferSource.noGC();
		bufferSource.connect(gain);

		this._gainNode = gain;
	}

	/* let this Knob drive something (any AudioNode's input) */
	drive(audioNode, input = 0) {

		// if it's an AudioParam kind off thing we first need set it back to zero
		if (typeof audioNode.cancelScheduledValues === 'function') {
			audioNode.cancelScheduledValues(Context.currentTime);
			audioNode.value = 0.0;
		}

		if (input === 0) {
			// in case its just an AudioParam lets not mess with native signatures
			return this._gainNode.connect(audioNode);
		} else {
			return this._gainNode.connect(audioNode, 0, input);
		}
	}

	get param() {
		return this._gainNode.gain;
	}

	set value(v) {
		this._gainNode.gain.value = v;
	}

	get value() {
		return this._gainNode.gain.value;
	}

	get id() {
		return this.id_;
	}

	log(message, always) {
		if (!ENABLE_LOG) {
			return;
		}
		if (always) {
			console.log('Knob' + this.id + ' > ' + message);
		}
		doer.maybeLog('Knob' + this.id + ' > ' + message);
	}

	debug() {
		this.log('debug()', true);
		this.log('current value: ' + this.value, true);
	}
}

export default Knob;