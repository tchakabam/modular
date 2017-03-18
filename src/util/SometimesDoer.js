const DEFAULT_PROBABILITY = 0;

let probability = DEFAULT_PROBABILITY;

class SometimesDoer {
	constructor(probability) {
		this.probability = probability;
	}

	static set probability(p) { probability = p; }
	static get probability() { return probability; }
	static get instance() { 
		if (instance.probability != probability) {
			instance = new SometimesDoer(probability);
		}
		return instance;
	}

	maybe(fn) {
		const doIt = Math.random();
		if (doIt < this.probability) {
			fn.call();
		}
	}

	maybeLog(msg) {
		this.maybe(console.log.bind(console, msg));
	}
}

var instance = new SometimesDoer(DEFAULT_PROBABILITY);

export default SometimesDoer;