import Context from './Context';

const QUEUE_MAX_SIZE = 4096;

const defaultAudioCtx = Context.getOrCreateDefaultAudioContext();

class Knob {
	constructor(processFunc = function() {}, bufferSize = 0, initialValue = 0.0) {

		this.data_ = null;
		this.queue_ = [];
		this.queueing = false;

		const knob = this;
		const scriptProcNode = this.scriptProcNode = defaultAudioCtx.createScriptProcessor(bufferSize, 1, 1);
		this.scriptProcNode.onaudioprocess = (audioProcessingEvent) => {
			const {inputBuffer, outputBuffer} = audioProcessingEvent;
			const sampleDuration = inputBuffer.duration / inputBuffer.length;
			const inputData = inputBuffer.getChannelData(0);

			// setup data path
			knob.data_ = inputData;

			if (this.queueing) {
				if (knob.queue_.length >= QUEUE_MAX_SIZE) {
					throw new Error('Exceeded max queue size');
				}
				knob.queue_.push(inputData);				
			}

			processFunc(inputData, outputBuffer.getChannelData(0), Context.currentTime, sampleDuration);
		}

		/* TODO: implement event listeners on AudioNode
		scriptProcNode.addEventListener('statechange', () => {

		});
		*/

		Context.patchToDevice(scriptProcNode, 0.0);

		/*
		const gainNode = this.gainNode = defaultAudioRateSource.connect(defaultAudioCtx.createGain());
		gainNode.gain.value = initialValue;
		Context.patchToDevice(gainNode, 0.0);
		*/
	}

	set queueing(q) {
		this.queueing_ = q;
	}

	get queueing() {
		return this.queueing_;
	}

	get data() { return this.data_; }

	pop() {
		if (!this.queue_.length) {
			return null;
		}
		return this.queue_.shift();
	}

	get audioNode() {
		return this.scriptProcNode;
	}

	/*
	get audioParam() {
		return this.gainNode.gain;
	}

	get value() {
		return this.audioParam.value;
	}

	set value(v) {
		this.gainNode.gain.value = v;
	}
	*/
}

export default Knob;