let defaultAudioContext = null;
let defaultAudioSourceNode = null;
let guid = 0;

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

	/*
	 * node can be AudioNode or Node
	 */
	static patchToDevice(node, gain = 1.0) {
		let destination = Context.destination;
		let audioNode = node.connect ? node : node.output;
		if (gain < 1.0) {
			const gainNode = Context.getOrCreateDefaultAudioContext().createGain();
			gainNode.gain.value = gain;
			return audioNode
				.connect(gainNode)
				.connect(Context.destination);
		}
		return audioNode
				.connect(destination);
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
}

export default Context;