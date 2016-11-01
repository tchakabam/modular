import Map from 'es6-map';

import Knob from './Knob';
import Context from './Context';

import SometimesDoer from '../util/SometimesDoer';

const doer = new SometimesDoer(0.001);

const ENABLE_LOG = false;

class Nodule {
	constructor(bufferSize = 0, name = null) {
		this.defaultKnob = new Knob(this.process.bind(this));
		this.knobs = new Map();
		this.autoCreateKnobs = false;
		if(!name) {
			throw new Error('A base name must be provided');
		}
		name = Nodule.tokenizeName(name);

		this.name_ = name;
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
			outData[sample] = this.tdtf(
				inData[sample], 
				time + (sample * sampleDuration), 
				knobsDataHash,
				sample
			);
		}
		this.log('buffer length: ' + inData.length, true);
	}

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
		return this;
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
		if (!name) {
			return this.defaultKnob;
		}
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

	get output() {
		return this.knob().audioNode;
	}

	/*
	 * Connects a native AudioNode with one of this Node's knob
	 * or it's default knob (when no name provided, see knob getter).
	 * Returns a reference to this Node.
	 */
	connectWithKnob(audioNode, name/*, asParam*/) {
		audioNode.connect(/*asParam ? this.knob(name).audioParam : */this.knob(name).audioNode);
		return this;
	}

	/*
	 * Connects a native AudioNode to this Node's output
	 * and returns a reference to this Node.
	 */ 
	connectToOutput(audioNodeOrParam) {
		this.output.connect(audioNodeOrParam);
		return this;
	}

	static patch(fromNode, toNode, name, asParam) {
		toNode.connectWithKnob(fromNode.output, name, asParam);
		return toNode;
	}

	static tokenizeName(name) {
		return name + Context.newGuid();
	}
}

export default Nodule;