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

		this.inputUnpluggers = [];
		this.knobUnpluggers = [];
		this.noOfPlugs_ = 0;

		this._scriptProcNode = null;
		this._createScriptProc(0);

		Context.registerNodule(this);
	}

	dispose() {
		Context.unregisterNodule(this);
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

	getKnobs() {
		return Array.from(this.knobs);
	}

	getParams() {
		return this.params.slice();
	}

	set name(n) {
		throw new Error('Nodule names are currently read-only (FIXME)');
		this.name_ = n;
	}

	get name() {
		return this.name_;
	}

	get isUnplugged() {
		return this.noOfPlugs_ === 0;
	}

	get noOfPlugs() {
		return this.noOfPlugs_;
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

	createKnob(name, bufferSize, initialValue) {
		if (this.hasKnob(name)) {
			this.error('Knob already exists: ' + name);
			return this;
		}
		const newKnob = new Knob(bufferSize, initialValue);
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

	decrementNoOfPlugs_() {
		this.noOfPlugs_--;
	}

	incrementNoOfPlugs_() {
		this.noOfPlugs_++;
	}

	/*
	 * Connects a native AudioNode with one of this Node's knobs
	 * Returns a reference to this Node.
	 */
	plugKnob(audioNode, name) {
		const audioParam = this.knob(name).param;
		audioNode.connect(audioParam);
		this.knobUnpluggers.push({
			src: audioNode,
			knobParam: audioParam,
			run: () => {
				audioNode.disconnect(audioParam);
			}
		});
		this.incrementNoOfPlugs_();
		return this;
	}

	unplugKnob(audioNode, name) {
		const audioParam = this.knob(name).param;
		audioNode.disconnect(audioParam);
		this.knobUnpluggers.splice(
			this.knobUnpluggers.findIndex((ku) => ku.src === audioNode), 
			1
		);
		this.decrementNoOfPlugs_();
	}

	plugInput(audioNode) {
		const inputNode = this.input;
		audioNode.connect(inputNode);
		this.inputUnpluggers.push({
			src: audioNode,
			inputNode,
			run: () => {
				audioNode.disconnect(inputNode);
			}
		});
		this.incrementNoOfPlugs_();
		return this;
	}

	unplugInput(audioNode) {
		audioNode.disconnect(this.input);
		this.inputUnpluggers.splice(
			this.inputUnpluggers.findIndex((iu) => iu.src === audioNode), 
			1
		);
		this.decrementNoOfPlugs_();
	}

	unplugEverything() {
		this.output.disconnect();
		this.knobUnpluggers.forEach((ku) => ku.run());
		this.inputUnpluggers.forEach((iu) => iu.run());
	}

	debug() {
		this.print('');
		this.print('debug()');
		this.print('nodule name: ' + this.name);
		this.isUnplugged && this.print('unplugged!');
		this.print('no of knobs: ' + this.knobs.size);
		this.print('no of plugs: ' + this.noOfPlugs);
		this.print('no of knob plugs: ' + this.knobUnpluggers.length);
		this.print('no of input plugs: ' + this.inputUnpluggers.length);
		this.knobs.forEach((knob, knobKeyName) => {
			this.print('knob mapped as param: ' + knobKeyName);
			knob.debug();
		}, this);
	}

	/*
	 * Connects a native AudioNode to this Nodule's output
	 * and returns a reference to this Nodule.
	 */ 
	static patch(fromNodule, toNodule, knobName = null) {
		Context.registerPatch(fromNodule, toNodule, knobName);

		if (knobName) {
			toNodule.plugKnob(fromNodule.output, knobName);
		} else {
			toNodule.plugInput(fromNodule.output);
		}

		return toNodule;
	}

	static unpatch(fromNodule, toNodule, knobName = null) {
		Context.unregisterPatch(fromNodule, toNodule, knobName);

		if (knobName) {
			toNodule.unplugKnob(fromNodule.output, knobName);
		} else {
			toNodule.unplugInput(fromNodule.output);
		}	
	}

	static unpatchAll(fromNodule_) {
		Context.unregisterAllPatches(fromNodule_);

		Nodule.prototype.unplugEverything.call(fromNodule_);
	}

	static tokenizeName(name) {
		return name + Context.newGuid();
	}
}

export default Nodule;