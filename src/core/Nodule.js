import Map from 'es6-map';

import Knob from './Knob';
import Context from './Context';

import SometimesDoer from '../util/SometimesDoer';
const doer = new SometimesDoer(0.001);
const ENABLE_LOG = true;

class Nodule {
	constructor(name = null, bufferSize = 0) {
		this.name_ = Nodule.tokenizeName(name);
		this.signal_ = new Knob(this.process.bind(this));
		this.knobs = new Map();
		this.autoCreateKnobs = false;
		if(!name) {
			throw new Error('A base name must be provided');
		}

		Context.registerNodule(this);
	}

	set name(n) {
		this.name_ = n;
	}

	get name() {
		return this.name_;
	}

	error(message) {
		throw new Error(this.name + ' error: ' + message);
	}

	log(message, always) {
		if (!ENABLE_LOG) {
			return;
		}
		if (always) {
			console.log(this.name + ' > ' + message);
		}
		doer.maybeLog(this.name + ' > ' + message);
	}

	process(inData, outData, time, sampleDuration) {

		const knobsDataHash = {}; 
		this.knobs.forEach((knob, name) => {
			knobsDataHash[name] = knob.pop();
		});

		// Iterate over buffers in the time-domain
		for (let sample = 0; sample < inData.length; sample++) {
			// first the tick function
			this.tick(
				inData[sample], 
				time + (sample * sampleDuration), 
				knobsDataHash, 
			sample);
			// now the dsp func
			outData[sample] = this.tdtf(
				inData[sample], 
				time + (sample * sampleDuration), 
				knobsDataHash,
				sample
			);
		}
		//this.log('buffer length: ' + inData.length, true);
	}

	/*
	 * Called for each sample but has no return value.
	 * Can be used to read out a-rate params and mutate state accordingly.
	 */
	tick(inSample, time, knobsDataHash, knobBufferOffset) {}

	/*
	 * Time-domain transfer function
	 */
	tdtf(inSample, time, knobsDataHash, knobBufferOffset) {
		return 0;
	}

	createKnob(name, procFunc, bufferSize, initialValue) {
		if (this.hasKnob(name)) {
			this.error('Knob already exists: ' + name);
			return this;
		}
		const newKnob = new Knob(procFunc, bufferSize, initialValue);
		newKnob.queueing = true;
		this.knobs.set(name, newKnob);
		return newKnob;
	}

	hasKnob(name) {
		return this.knobs.has(name);
	}

	removeKnob(name) {
		if (!this.hasKnob(name)) {
			this.error('Knob doesn\'t exist: ' + name);
			return this;
		}
		this.knobs.delete(name);
		return this;
	}

	knob(name) {
		if (!this.knobs.has(name)) {
			if (this.autoCreateKnobs) {
				this.createKnob(name);
			} else {
				this.error('No such knob: ' + name)
				return;
			}
		}
		return this.knobs.get(name);
	}

	get input() {
		return this.signal_.audioNode;
	}

	get output() {
		return this.signal_.audioNode;
	}

	/*
	 * Connects a native AudioNode with one of this Node's knobs
	 * Returns a reference to this Node.
	 */
	connectWithKnob(audioNode, name) {
		audioNode.connect(this.knob(name).audioNode);
		// lets make sure it's not currently value locked
		//this.knob(name).unlock();
		return this;
	}

	connectWithInput(audioNode) {
		audioNode.connect(this.input);
		return this;
	}

	/*
	 * Connects a native AudioNode to this Nodule's output
	 * and returns a reference to this Nodule.
	 */ 
	/*
	connectToOutput(audioNodeOrParam) {
		this.output.connect(audioNodeOrParam);
		return this;
	}
	*/

	static patch(fromNodule, toNodule, name) {
		if (name) {
			toNodule.connectWithKnob(fromNodule.output, name);	
		} else {
			toNodule.connectWithInput(fromNodule.output);
		}

		Context.registerPatch(fromNodule, toNodule);

		return toNodule;
	}

	static tokenizeName(name) {
		return name + Context.newGuid();
	}
}

export default Nodule;