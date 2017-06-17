import Map from 'es6-map';

import Graph from '../ui/graph/Graph';

const patches = [];
const nodules = new Map();

let defaultAudioContext = null;
let defaultAudioSourceNode = null;
let guid = 0;
let uiElement = null;
let graph = null;

class Context {
	constructor() {
		throw new Error('Context is not supposed to be constructed');
	}

	static getOrCreateDefaultAudioContext() {
		return defaultAudioContext || (defaultAudioContext = new (window.AudioContext || window.webkitAudioContext)());
	}

	static get currentTime() {
		return Context.getOrCreateDefaultAudioContext().currentTime;
	}

	static get sampleRate() {
		return Context.getOrCreateDefaultAudioContext().sampleRate;
	}

	static get destination() {
		return Context.getOrCreateDefaultAudioContext().destination
	}

	static newGuid() {
		return guid++;
	}

	static silentRouteAudioNode(audioNode) {
		const destination = Context.destination;
		const gainNode = Context.getOrCreateDefaultAudioContext().createGain();
		gainNode.gain.value = 0.0;
		return audioNode
			.connect(gainNode)
			.connect(destination);	
	}

	/*
	 * Can be AudioNode or Nodule
	 */
	static patchToDevice(nodule, gain = 1.0) {
		const destination = Context.destination;
		const audioNode = nodule.output;

		Context.registerPatch(nodule, null, 'x' + gain);

		if (gain < 1.0) {
			const gainNode = Context.getOrCreateDefaultAudioContext().createGain();
			gainNode.gain.value = gain;
			audioNode
				.connect(gainNode)
				.connect(destination);
		} else {
			audioNode
				.connect(destination);			
		}
		return nodule;
	}

	static getOrCreateDefaultAudioRateSource() {
		if (defaultAudioSourceNode) {
			return defaultAudioSourceNode;
		}
		/*
		const buffer = Context.getOrCreateDefaultAudioContext().createBuffer(1, 44100, 44100);
		const bufferSourceNode = Context.getOrCreateDefaultAudioContext().createBufferSource();
		const data = buffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) {
			data[i] = Math.random();
		}
		bufferSourceNode.buffer = buffer;
		bufferSourceNode.loop = true;
		bufferSourceNode.start();
		console.log('A-rate source started');
		bufferSourceNode.onended = () => {
			console.log('A-rate source ended');
		}
		*/
		defaultAudioSourceNode = Context.getOrCreateDefaultAudioContext().createOscillator();
		defaultAudioSourceNode.start();
		console.log('A-rate source started');

		return defaultAudioSourceNode;
	}

	static checkForPatch(from, to, knobName = null) {
		console.log('checkForPatch', from, to);
		const patchIndex = patches.findIndex(
			(patch) => 
				patch.from === from 
				&& patch.to === to
				&& patch.knobName === knobName
		);
		return patchIndex >= 0;
	}

	static registerPatch(from, to, knobName = null) {
		if (Context.checkForPatch(from, to, knobName)) {
			throw new Error('Patch requested to register already registered!');
		}
		patches.push({
			from,
			to,
			knobName
		});
	}

	static unregisterPatch(from, to, knobName) {
		const patchIndex = patches.findIndex(
			(patch) => 
				patch.from === from 
				&& patch.to === to
				&& patch.knobName === knobName
		);
		console.log('unregisterPatch', patchIndex);
		if (patchIndex < 0) {
			throw new Error('Patch requested to unregister was never registered!');
		}
		patches.splice(patchIndex, 1);
	}

	static unregisterAllPatches(fromAndTo) {
		patches.slice().forEach((patch) => {
			if (patch.from === fromAndTo 
				|| patch.to === fromAndTo) {
				Context.unregisterPatch(patch.from, patch.to, patch.knobName);
			}
		});
	}

	static registerNodule(nodule) {
		const name = nodule.name
		if (nodules.has(name)) {
			throw new Error('Nodule was already added to context: ' + name);
		}
		nodules.set(name, nodule);

		return Context;
	}

	static unregisterNodule(nodule) {
		const name = nodule.name
		if (!nodules.has(name)) {
			throw new Error('Nodule was never added to context: ' + name);
		}
		nodules.delete(name);

		return Context;
	}

	static setContainer(elementOrId) {
		if (uiElement) {
			throw new Error('uiElement already set');
		}

		const type = typeof elementOrId;
		switch (type) {
		case 'string':
			const el = document.getElementById(elementOrId);
			if (!el) {
				throw new Error('No such element: ' + elementOrId);
			}
			uiElement = el;
			break;
		case 'object':
			uiElement = elementOrId;
			break;
		default:
			throw new Error('Type of UI element can not be ' + type);
		}

		graph = new Graph(Context);
	}

	static unmountContainer() {
		uiElement = null;
		// TODO: do more here
	}

	static get container() {
		return uiElement;
	}

	static get nodules() {
		return nodules;
	}

	static get patches() {
		return patches;
	}

	static refresh() {
		graph.refresh();
	}
}

export default Context;