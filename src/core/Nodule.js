import Map from 'es6-map';

import Knob from './Knob';
import Context from './Context';

import SometimesDoer from '../util/SometimesDoer';
const doer = new SometimesDoer(0.001);
const ENABLE_LOG = true;

const defaultAudioCtx = Context.getOrCreateDefaultAudioContext();

class Nodule {
	constructor(name = null, bufferSize = 0) {

		this.name_ = Nodule.tokenizeName(name);
		
		this.bufferSize = bufferSize;
		this.knobs = new Map();
		this.params = [];
		this.autoCreateKnobs = false;
		if(!name) {
			throw new Error('A base name must be provided');
		}

		this.scriptProcNode = null;

		this._createScriptProc(0);

		Context.registerNodule(this);
	}

	_createScriptProc(noOfParams = 0) {

		if (typeof noOfParams !== 'number' || noOfParams < 0) {
			throw new Error('Need a positive amount of params');
		}

		if (this.params.length !== noOfParams) {
			throw new Error('Cant create scriptProcNode with invalid number of params');
		}

		if (this._channelMerger) {
			this._channelMerger.disconnect();
		}
		if (this._scriptProcNode) {
			this._scriptProcNode.disconnect();
		}

		this._channelMerger = defaultAudioCtx.createChannelMerger(noOfParams + 1);
		this._scriptProcNode = defaultAudioCtx.createScriptProcessor(this.bufferSize, noOfParams + 1, 1);

		this._scriptProcNode.onaudioprocess = (audioProcessingEvent) => {
			const {inputBuffer, outputBuffer} = audioProcessingEvent;
			const sampleDuration = inputBuffer.duration / inputBuffer.length;
			const inputData = inputBuffer.getChannelData(0);
			const outputData = outputBuffer.getChannelData(0);
			const paramHash = {};

			for (let i = 0; i < noOfParams; i++) {
				paramHash[this.params[i]] = inputBuffer.getChannelData(i + 1);
			}

			this.process(inputData, outputData, paramHash, Context.currentTime, sampleDuration);
		}

		this._channelMerger.connect(this._scriptProcNode);

		for (let i = 0; i < noOfParams; i++) {
			try {
				this.knobs.get(this.params[i]).drive(this._channelMerger, i + 1);	
			} catch (e) {
				console.error(e);
			}
		}
	}

	set name(n) {
		throw new Error('Nodule names are currently read-only (FIXME)');
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
			this.print(message);
			return;
		}
		doer.maybeLog(this.name + ' > ' + message);
	}

	print(message) {
		window.console.log(this.name + ' > ' + message);
	}

	process(inData, outData, paramHash, time, sampleDuration) {
		// Iterate over buffers in the time-domain
		for (let sample = 0; sample < inData.length; sample++) {
			
			// first the tick function
			this.tick(
				inData[sample], 
				time + (sample * sampleDuration), 
				paramHash, 
				sample);

			// now the "dsp" time-domain transfer func
			outData[sample] = this.tdtf(
				inData[sample], 
				time + (sample * sampleDuration), 
				paramHash,
				sample
			);
		}
	}

	/*
	 * Called for each sample but has no return value.
	 * Can be used to read out a-rate params and mutate state accordingly.
	 */
	tick(inSample, time, paramHash, sampleIdx) {}

	/*
	 * Time-domain transfer function
	 */
	tdtf(inSample, time, paramHash, sampleIdx) {
		return 0;
	}

	createKnob(name, procFunc, bufferSize, initialValue) {
		if (this.hasKnob(name)) {
			this.error('Knob already exists: ' + name);
			return this;
		}
		const newKnob = new Knob(procFunc, bufferSize, initialValue);
		this.knobs.set(name, newKnob);
		this.params.push(name);
		this._createScriptProc(this.params.length);
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
		// FIXME:
		// TODO: remove from params !!
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
		return this._channelMerger;
	}

	get output() {
		return this._scriptProcNode;
	}

	/*
	 * Connects a native AudioNode with one of this Node's knobs
	 * Returns a reference to this Node.
	 */
	plugKnob(audioNode, name) {
		audioNode.connect(this.knob(name).param);
		return this;
	}

	plugInput(audioNode) {
		audioNode.connect(this.input);
		return this;
	}

	drive(audioNode) {
		this.output.connect(audioNode);
	}

	debug() {
		this.print('');
		this.print('debug()');
		this.print('nodule name: ' + this.name);
		this.print('knobs: ' + this.knobs.size);
		this.knobs.forEach((knob, knobKeyName) => {
			this.print('mapped as: ' + knobKeyName);
			knob.debug();
		}, this);
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
	static patch(fromNodule, toNodule, knobName = null) {
		if (knobName) {
			toNodule.plugKnob(fromNodule.output, knobName);
		} else {
			toNodule.plugInput(fromNodule.output);
		}

		Context.registerPatch(fromNodule, toNodule, knobName);

		return toNodule;
	}

	static tokenizeName(name) {
		return name + Context.newGuid();
	}
}

export default Nodule;