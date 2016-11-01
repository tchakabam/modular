import Map from 'es6-map';

import Input from './Input';
import Context from './Context';

import SometimesDoer from '../util/SometimesDoer';
const doer = new SometimesDoer(0.001);

const ENABLE_LOG = false;

class Node {
	constructor(bufferSize = 0, name = null) {
		this.defaultInput = new Input(this.process.bind(this));
		this.inputs = new Map();
		this.autoCreateInputs = false;
		if(!name) {
			throw new Error('A base name must be provided');
		}
		name = Node.tokenizeName(name);

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

	process(inputData, outputData, time, sampleDuration) {

		const inputsDataHash = {}; 
		this.inputs.forEach((input, name) => {
			inputsDataHash[name] = input.pop();
		});

		// Iterate over buffers in the time-domain
		for (let sample = 0; sample < inputData.length; sample++) {
			outputData[sample] = this.tdtf(
				inputData[sample], 
				time + (sample * sampleDuration), 
				inputsDataHash,
				sample
			);
		}
		this.log('buffer length: ' + inputData.length, true);
	}

	/*
	 * Time-domain transfer function
	 */
	tdtf(inputSample, time, inputsDataHash, inputBufferOffset) {
		return 0;
	}

	createInput(name, procFunc, bufferSize, initialValue) {
		if (this.hasInput(name)) {
			this.error('Input already exists: ' + name);
			return this;
		}
		const newInput = new Input(procFunc, bufferSize, initialValue);
		newInput.queueing = true;
		this.inputs.set(name, newInput);
		return this;
	}

	hasInput(name) {
		return this.inputs.has(name);
	}

	removeInput(name) {
		if (!this.hasInput(name)) {
			this.error('Input doesn\'t exist: ' + name);
			return this;
		}
		this.inputs.delete(name);
		return this;
	}

	input(name) {
		if (!name) {
			return this.defaultInput;
		}
		if (!this.inputs.has(name)) {
			if (this.autoCreateInputs) {
				this.createInput(name);
			} else {
				this.error('No such input: ' + name)
				return;
			}
		}
		return this.inputs.get(name);
	}

	get output() {
		return this.input().audioNode;
	}

	/*
	 * Connects a native AudioNode with one of this Node's input
	 * or it's default input (when no name provided, see input getter).
	 * Returns a reference to this Node.
	 */
	connectWithInput(audioNode, name/*, asParam*/) {
		audioNode.connect(/*asParam ? this.input(name).audioParam : */this.input(name).audioNode);
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
		toNode.connectWithInput(fromNode.output, name, asParam);
		return toNode;
	}

	static tokenizeName(name) {
		return name + Context.newGuid();
	}
}

export default Node;