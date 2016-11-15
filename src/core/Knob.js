import Context from './Context';
import Knot from './Knot';

const QUEUE_MAX_SIZE = 4096;

const defaultAudioCtx = Context.getOrCreateDefaultAudioContext();

import SometimesDoer from '../util/SometimesDoer';
const doer = new SometimesDoer(0.01);
const ENABLE_LOG = true;

class Knob extends Knot {
	constructor(processFunc = function() {}, bufferSize = 8192, initialValue = 0.0) {
		super();

		this.data_ = null;
		this.queue_ = [];
		this.queueing = false;
		this.value_ = initialValue || null;
		this.id_ = Context.newGuid();

		const knob = this;
		const scriptProcNode = this.scriptProcNode = defaultAudioCtx.createScriptProcessor(bufferSize, 1, 1);
		scriptProcNode.onaudioprocess = (audioProcessingEvent) => {
			const {inputBuffer, outputBuffer} = audioProcessingEvent;
			const sampleDuration = inputBuffer.duration / inputBuffer.length;
			const inputData = inputBuffer.getChannelData(0);
			const outputData = outputBuffer.getChannelData(0);

			// setup data path

			if (knob.locked) {
				for (let i = 0; i < outputData.length; i++) {
					outputData[i] = this.value;
				}
				
			} else {
				for (let i = 0; i < outputData.length; i++) {
					outputData[i] = inputData[i];
				}
				processFunc(inputData, outputData, Context.currentTime, sampleDuration);
			}

			knob.data_ = outputData;

			if (this.queueing) {
				if (knob.queue_.length >= QUEUE_MAX_SIZE) {
					throw new Error('Exceeded max queue size');
				}
				knob.queue_.push(knob.data_);
			}
		}

		/* TODO: implement event listeners on AudioNode
		scriptProcNode.addEventListener('statechange', () => {

		});
		*/

		Context.silentRouteAudioNode(scriptProcNode);
	}

	set queueing(q) {
		this.queueing_ = q;
	}

	get queueing() {
		return this.queueing_;
	}

	pop() {
		if (!this.queue_.length) {
			return null;
		}
		return this.queue_.shift();
	}

	get data() { return this.data_; }

	get audioNode() {
		return this.scriptProcNode;
	}

	get value() {
		return this.value_;
	}

	set value(value) {
		this.value_ = value;
	}

	get locked() {
		return this.value_ !== null;
	}

	get id() {
		return this.id_;
	}

	unlock() {
		this.value = null;
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
}

export default Knob;